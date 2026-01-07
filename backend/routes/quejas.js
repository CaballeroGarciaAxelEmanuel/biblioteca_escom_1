// backend/routes/quejas.js - VERSIÓN DEFINITIVA
// Adaptada a tu estructura real de tabla

const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ==========================================
// OBTENER TODAS LAS QUEJAS Y SUGERENCIAS
// ==========================================
router.get('/', (req, res) => {
    const query = `
        SELECT 
            qs.id,
            qs.usuario_id,
            u.nombre as nombre_usuario,
            u.email,
            qs.tipo,
            qs.mensaje as descripcion,
            qs.respuesta,
            qs.estado,
            qs.leido,
            qs.fecha as fecha_creacion,
            qs.fecha_respuesta
        FROM quejas_sugerencias qs
        LEFT JOIN usuarios u ON qs.usuario_id = u.id
        ORDER BY qs.fecha DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener quejas:', err);
            return res.status(500).json({ 
                error: 'Error al obtener quejas',
                detalles: err.message 
            });
        }
        res.json(results);
    });
});

// ==========================================
// OBTENER UNA QUEJA POR ID
// ==========================================
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            qs.id,
            qs.usuario_id,
            u.nombre as nombre_usuario,
            u.email,
            qs.tipo,
            qs.mensaje as descripcion,
            qs.respuesta,
            qs.estado,
            qs.leido,
            qs.fecha as fecha_creacion,
            qs.fecha_respuesta
        FROM quejas_sugerencias qs
        LEFT JOIN usuarios u ON qs.usuario_id = u.id
        WHERE qs.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener queja:', err);
            return res.status(500).json({ 
                error: 'Error al obtener queja',
                detalles: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Queja no encontrada' });
        }
        
        res.json(results[0]);
    });
});

// ==========================================
// CREAR NUEVA QUEJA/SUGERENCIA
// ==========================================
router.post('/', (req, res) => {
    const { usuario_id, tipo, mensaje } = req.body;
    
    // Validaciones
    if (!tipo || !mensaje) {
        return res.status(400).json({ 
            error: 'Los campos tipo y mensaje son obligatorios' 
        });
    }
    
    if (tipo !== 'QUEJA' && tipo !== 'SUGERENCIA' && tipo !== 'FELICITACION') {
        return res.status(400).json({ 
            error: 'El tipo debe ser QUEJA, SUGERENCIA o FELICITACION' 
        });
    }
    
    const query = `
        INSERT INTO quejas_sugerencias 
        (usuario_id, tipo, mensaje, estado, leido) 
        VALUES (?, ?, ?, 'pendiente', 0)
    `;
    
    db.query(query, [usuario_id, tipo, mensaje], (err, result) => {
        if (err) {
            console.error('Error al crear queja:', err);
            return res.status(500).json({ 
                error: 'Error al crear queja',
                detalles: err.message 
            });
        }
        
        res.status(201).json({ 
            mensaje: 'Queja/Sugerencia creada exitosamente',
            id: result.insertId 
        });
    });
});

// ==========================================
// RESPONDER A UNA QUEJA/SUGERENCIA
// ==========================================
router.put('/:id/responder', (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;
    
    if (!respuesta) {
        return res.status(400).json({ 
            error: 'La respuesta es obligatoria' 
        });
    }
    
    const query = `
        UPDATE quejas_sugerencias 
        SET respuesta = ?, 
            fecha_respuesta = NOW(),
            estado = 'resuelta',
            leido = 1
        WHERE id = ?
    `;
    
    db.query(query, [respuesta, id], (err, result) => {
        if (err) {
            console.error('Error al responder queja:', err);
            return res.status(500).json({ 
                error: 'Error al responder queja',
                detalles: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Queja no encontrada' });
        }
        
        res.json({ mensaje: 'Respuesta enviada exitosamente' });
    });
});

// ==========================================
// CAMBIAR ESTADO DE UNA QUEJA/SUGERENCIA
// ==========================================
router.put('/:id/estado', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'en_proceso', 'resuelta', 'cerrada'];
    
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ 
            error: 'Estado inválido. Debe ser: pendiente, en_proceso, resuelta o cerrada' 
        });
    }
    
    const query = `
        UPDATE quejas_sugerencias 
        SET estado = ?
        WHERE id = ?
    `;
    
    db.query(query, [estado, id], (err, result) => {
        if (err) {
            console.error('Error al cambiar estado:', err);
            return res.status(500).json({ 
                error: 'Error al cambiar estado',
                detalles: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Queja no encontrada' });
        }
        
        res.json({ mensaje: 'Estado actualizado exitosamente' });
    });
});

// ==========================================
// MARCAR COMO LEÍDO/NO LEÍDO
// ==========================================
router.put('/:id/marcar-leido', (req, res) => {
    const { id } = req.params;
    const { leido } = req.body; // true o false
    
    if (typeof leido !== 'boolean') {
        return res.status(400).json({ 
            error: 'El campo leido debe ser true o false' 
        });
    }
    
    // Convertir boolean a 0 o 1 para MySQL
    const leidoValue = leido ? 1 : 0;
    
    const query = `
        UPDATE quejas_sugerencias 
        SET leido = ?
        WHERE id = ?
    `;
    
    db.query(query, [leidoValue, id], (err, result) => {
        if (err) {
            console.error('Error al marcar como leído:', err);
            return res.status(500).json({ 
                error: 'Error al marcar como leído',
                detalles: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Queja no encontrada' });
        }
        
        res.json({ 
            mensaje: leido ? 'Marcado como leído' : 'Marcado como no leído' 
        });
    });
});

// ==========================================
// ELIMINAR UNA QUEJA/SUGERENCIA
// ==========================================
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM quejas_sugerencias WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar queja:', err);
            return res.status(500).json({ 
                error: 'Error al eliminar queja',
                detalles: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Queja no encontrada' });
        }
        
        res.json({ mensaje: 'Queja/Sugerencia eliminada exitosamente' });
    });
});

// ==========================================
// OBTENER ESTADÍSTICAS
// ==========================================
router.get('/estadisticas/resumen', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN tipo = 'QUEJA' THEN 1 ELSE 0 END) as total_quejas,
            SUM(CASE WHEN tipo = 'SUGERENCIA' THEN 1 ELSE 0 END) as total_sugerencias,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
            SUM(CASE WHEN estado = 'resuelta' THEN 1 ELSE 0 END) as resueltas,
            SUM(CASE WHEN estado = 'cerrada' THEN 1 ELSE 0 END) as cerradas,
            SUM(CASE WHEN leido = 0 THEN 1 ELSE 0 END) as no_leidas
        FROM quejas_sugerencias
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            return res.status(500).json({ 
                error: 'Error al obtener estadísticas',
                detalles: err.message 
            });
        }
        
        res.json(results[0]);
    });
});

module.exports = router;
