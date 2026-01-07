// backend/routes/multas.js - VERSIÓN COMPLETA CON MATERIALES
const express = require('express');
const router = express.Router();
const db = require('../database/connection');


// ============================================
// 1. REGISTRAR MULTA POR DAÑO/PÉRDIDA
// ============================================
router.post('/', async (req, res) => {
    const { usuario_id, material_id, tipo, monto, descripcion } = req.body;
    
    console.log('💰 Registrando multa:', { usuario_id, material_id, tipo, monto });
    
    // VALIDACIÓN 1: Monto entre 1000-3000
    if (monto < 1000 || monto > 3000) {
        return res.status(400).json({
            success: false,
            error: 'ERR-MULTA-01',
            message: 'ERROR_MULTA_01: El monto debe estar entre $1,000 y $3,000 MXN'
        });
    }
    
    try {
        // VALIDACIÓN 2: Verificar que el usuario existe y es LECTOR ACTIVO
        const [usuario] = await db.promise().query(
            `SELECT id, nombre, email, rol, estado 
             FROM usuarios 
             WHERE id = ? 
             AND rol = 'LECTOR' 
             AND estado = 'ACTIVO'`,
            [usuario_id]
        );
        
        if (usuario.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'ERR-MULTA-02',
                message: 'ERROR_MULTA_02: Usuario no válido. Solo lectores activos pueden recibir multas.'
            });
        }
        
        // VALIDACIÓN 3: Verificar que el material existe
        const [material] = await db.promise().query(
            'SELECT id, titulo, autor FROM materiales WHERE id = ?',
            [material_id]
        );
        
        if (material.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'ERR-MULTA-03',
                message: 'ERROR_MULTA_03: Material no encontrado en el catálogo'
            });
        }
        
        // ========= REGISTRAR LA MULTA =========
        const [result] = await db.promise().query(
            `INSERT INTO multas 
             (usuario_id, material_id, tipo, monto, descripcion, estado)
             VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
            [usuario_id, material_id, tipo, monto, descripcion || '']
        );
        
        const multaId = result.insertId;
        console.log(`✅ Multa registrada ID: ${multaId}`);
        
        // ========= ACTUALIZAR CONTADORES DEL USUARIO =========
        await db.promise().query(
            `UPDATE usuarios 
             SET total_multas = total_multas + ?,
                 multas_pendientes = multas_pendientes + 1,
                 materiales_perdidos_acumulados = materiales_perdidos_acumulados + ?
             WHERE id = ?`,
            [monto, tipo === 'PERDIDA' ? 1 : 0, usuario_id]
        );
        
        // ========= VERIFICAR BLOQUEO AUTOMÁTICO (5 PÉRDIDAS) =========
        const [usuarioActualizado] = await db.promise().query(
            'SELECT materiales_perdidos_acumulados, nombre, email FROM usuarios WHERE id = ?',
            [usuario_id]
        );
        
        const perdidasAcumuladas = usuarioActualizado[0].materiales_perdidos_acumulados || 0;
        const bloqueoAutomatico = perdidasAcumuladas >= 5;
        
        if (bloqueoAutomatico) {
            console.log(`🚨 BLOQUEO AUTOMÁTICO: ${usuarioActualizado[0].nombre} - ${perdidasAcumuladas} pérdidas`);
            
            // 1. Bloquear al usuario
            await db.promise().query(
                `UPDATE usuarios 
                 SET estado = 'BLOQUEADO',
                     fecha_bloqueo_multa = NOW(),
                     razon_bloqueo = 'Bloqueo automático por acumular 5 materiales perdidos'
                 WHERE id = ?`,
                [usuario_id]
            );
            
            // 2. Registrar sanción de bloqueo
            await db.promise().query(
                `INSERT INTO sanciones_usuario (usuario_id, tipo, motivo, detalles)
                 VALUES (?, 'BLOQUEO', 'Bloqueo automático por 5 materiales perdidos',
                        'Usuario bloqueado automáticamente por acumular 5 materiales perdidos. Pérdidas actuales: ${perdidasAcumuladas}')`,
                [usuario_id]
            );
        }
        
        // ========= PREPARAR RESPUESTA =========
        const respuesta = {
            success: true,
            message: 'MSJ-MULTA-01: Éxito: La multa ha sido registrada correctamente.',
            multaId: multaId,
            datos: {
                usuario: usuarioActualizado[0].nombre,
                tipo: tipo,
                material: material[0].titulo,
                autor: material[0].autor,
                monto: monto,
                perdidasAcumuladas: perdidasAcumuladas
            }
        };
        
        if (bloqueoAutomatico) {
            respuesta.advertencia = '⚠️ USUARIO BLOQUEADO: Ha acumulado 5 materiales perdidos.';
            respuesta.bloqueoAutomatico = true;
        }
        
        res.json(respuesta);
        
    } catch (error) {
        console.error('❌ Error registrando multa:', error);
        res.status(500).json({
            success: false,
            error: 'ERR-MULTA-99',
            message: 'ERROR_MULTA_99: Error interno del servidor al registrar multa'
        });
    }
});

// ============================================
// 2. OBTENER TODAS LAS MULTAS
// ============================================
router.get('/', async (req, res) => {
    try {
        const [multas] = await db.promise().query(
            `SELECT m.*, 
                    u.nombre as usuario_nombre,
                    u.email as usuario_email,
                    u.materiales_perdidos_acumulados,
                    mat.titulo as material_titulo,
                    mat.autor as material_autor,
                    mat.editorial as material_editorial,
                    mat.categoria as material_categoria
             FROM multas m
             JOIN usuarios u ON m.usuario_id = u.id
             JOIN materiales mat ON m.material_id = mat.id
             ORDER BY m.fecha_multa DESC
             LIMIT 100`
        );
        
        res.json({
            success: true,
            multas: multas,
            total: multas.length
        });
        
    } catch (error) {
        console.error('Error obteniendo multas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo multas'
        });
    }
});

// ============================================
// 3. OBTENER MULTAS DE UN USUARIO ESPECÍFICO
// ============================================
router.get('/usuario/:id', async (req, res) => {
    const usuarioId = req.params.id;
    
    try {
        const [multas] = await db.promise().query(
            `SELECT m.*, mat.titulo as material_titulo
             FROM multas m
             JOIN materiales mat ON m.material_id = mat.id
             WHERE m.usuario_id = ?
             ORDER BY m.fecha_multa DESC`,
            [usuarioId]
        );
        
        // Obtener información del usuario
        const [usuario] = await db.promise().query(
            `SELECT id, nombre, email, materiales_perdidos_acumulados, 
                    total_multas, multas_pendientes
             FROM usuarios 
             WHERE id = ?`,
            [usuarioId]
        );
        
        res.json({
            success: true,
            usuario: usuario[0] || null,
            multas: multas,
            totalMultas: multas.length,
            totalPendiente: multas.filter(m => m.estado === 'PENDIENTE').length
        });
        
    } catch (error) {
        console.error('Error obteniendo multas del usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo multas del usuario'
        });
    }
});

// ============================================
// 4. MARCAR MULTA COMO PAGADA
// ============================================
router.patch('/:id/pagar', async (req, res) => {
    const multaId = req.params.id;
    
    console.log(`💳 Marcando multa ${multaId} como pagada`);
    
    try {
        // 1. Verificar que la multa existe y está pendiente
        const [multa] = await db.promise().query(
            'SELECT * FROM multas WHERE id = ? AND estado = "PENDIENTE"',
            [multaId]
        );
        
        if (multa.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'ERR-MULTA-06',
                message: 'ERROR_MULTA_06: Multa no encontrada o ya fue pagada/cancelada'
            });
        }
        
        // 2. Actualizar estado de la multa
        const [result] = await db.promise().query(
            `UPDATE multas 
             SET estado = 'PAGADA', 
                 fecha_pago = NOW()
             WHERE id = ?`,
            [multaId]
        );
        
        // 3. Actualizar contador del usuario
        await db.promise().query(
            `UPDATE usuarios 
             SET multas_pendientes = GREATEST(0, multas_pendientes - 1)
             WHERE id = ?`,
            [multa[0].usuario_id]
        );
        
        res.json({
            success: true,
            message: 'MSJ-MULTA-02: Éxito: La multa ha sido marcada como pagada.',
            multaId: multaId
        });
        
    } catch (error) {
        console.error('Error pagando multa:', error);
        res.status(500).json({
            success: false,
            error: 'ERR-MULTA-99',
            message: 'Error interno al procesar el pago'
        });
    }
});

// ============================================
// 5. CANCELAR MULTA (solo admin)
// ============================================
router.patch('/:id/cancelar', async (req, res) => {
    const multaId = req.params.id;
    const { razon } = req.body;
    
    try {
        const [result] = await db.promise().query(
            `UPDATE multas 
             SET estado = 'CANCELADA'
             WHERE id = ? AND estado = 'PENDIENTE'`,
            [multaId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Multa no encontrada o no está pendiente'
            });
        }
        
        // Actualizar contador del usuario
        const [multa] = await db.promise().query(
            'SELECT usuario_id, monto FROM multas WHERE id = ?',
            [multaId]
        );
        
        if (multa.length > 0) {
            await db.promise().query(
                `UPDATE usuarios 
                 SET multas_pendientes = GREATEST(0, multas_pendientes - 1),
                     total_multas = total_multas - ?
                 WHERE id = ?`,
                [multa[0].monto, multa[0].usuario_id]
            );
        }
        
        res.json({
            success: true,
            message: 'Multa cancelada correctamente'
        });
        
    } catch (error) {
        console.error('Error cancelando multa:', error);
        res.status(500).json({
            success: false,
            error: 'Error cancelando multa'
        });
    }
});

// ============================================
// 6. ESTADÍSTICAS DE MULTAS
// ============================================
router.get('/estadisticas', async (req, res) => {
    try {
        const [stats] = await db.promise().query(`
            SELECT 
                COUNT(*) as total_multas,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as multas_pendientes,
                SUM(CASE WHEN estado = 'PAGADA' THEN 1 ELSE 0 END) as multas_pagadas,
                SUM(CASE WHEN tipo = 'PERDIDA' THEN 1 ELSE 0 END) as por_perdida,
                SUM(CASE WHEN tipo = 'DANIO' THEN 1 ELSE 0 END) as por_danio,
                SUM(CASE WHEN tipo = 'RETRASO' THEN 1 ELSE 0 END) as por_retraso,
                SUM(monto) as total_recaudado,
                AVG(monto) as promedio_monto
            FROM multas
        `);
        
        // Multas por categoría de material
        const [porCategoria] = await db.promise().query(`
            SELECT mat.categoria, COUNT(*) as cantidad, SUM(m.monto) as total
            FROM multas m
            JOIN materiales mat ON m.material_id = mat.id
            GROUP BY mat.categoria
            ORDER BY cantidad DESC
        `);
        
        res.json({
            success: true,
            estadisticas: stats[0],
            porCategoria: porCategoria
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas'
        });
    }
});

module.exports = router;