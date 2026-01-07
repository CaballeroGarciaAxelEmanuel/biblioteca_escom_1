// backend/routes/configuracion.js
// CU-ADMIN-06: Configuración de Reglas de Negocio

const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ==========================================
// OBTENER CONFIGURACIÓN ACTUAL
// ==========================================
router.get('/', (req, res) => {
    const query = `
        SELECT * FROM configuracion_sistema 
        ORDER BY id DESC LIMIT 1
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener configuración:', err);
            return res.status(500).json({ 
                error: 'Error al obtener configuración',
                detalles: err.message 
            });
        }
        
        // Si no existe configuración, devolver valores por defecto
        if (results.length === 0) {
            return res.json({
                multa_primer_retraso: 500,
                multa_reincidente: 700,
                incremento_por_dia: 50,
                multa_dano_min: 1000,
                multa_dano_max: 3000,
                costo_membresia: 50,
                dias_renovacion: 5,
                limite_prestamos_sin_membresia: 1,
                limite_prestamos_con_membresia: 3,
                dias_suspension: 15,
                libros_perdidos_bloqueo: 5,
                meses_sin_pago_bloqueo: 3
            });
        }
        
        res.json(results[0]);
    });
});

// ==========================================
// ACTUALIZAR CONFIGURACIÓN
// ==========================================
router.put('/', (req, res) => {
    const {
        multa_primer_retraso,
        multa_reincidente,
        incremento_por_dia,
        multa_dano_min,
        multa_dano_max,
        costo_membresia,
        dias_renovacion,
        limite_prestamos_sin_membresia,
        limite_prestamos_con_membresia,
        dias_suspension,
        libros_perdidos_bloqueo,
        meses_sin_pago_bloqueo
    } = req.body;
    
    // Validaciones
    if (multa_dano_min >= multa_dano_max) {
        return res.status(400).json({ 
            error: 'El mínimo de multa por daño debe ser menor que el máximo' 
        });
    }
    
    // Primero verificar si existe configuración
    const checkQuery = 'SELECT id FROM configuracion_sistema LIMIT 1';
    
    db.query(checkQuery, (err, results) => {
        if (err) {
            console.error('Error al verificar configuración:', err);
            return res.status(500).json({ 
                error: 'Error al verificar configuración',
                detalles: err.message 
            });
        }
        
        let query;
        let params;
        
        if (results.length === 0) {
            // INSERT si no existe
            query = `
                INSERT INTO configuracion_sistema (
                    multa_primer_retraso, multa_reincidente, incremento_por_dia,
                    multa_dano_min, multa_dano_max, costo_membresia,
                    dias_renovacion, limite_prestamos_sin_membresia,
                    limite_prestamos_con_membresia, dias_suspension,
                    libros_perdidos_bloqueo, meses_sin_pago_bloqueo,
                    fecha_actualizacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            params = [
                multa_primer_retraso, multa_reincidente, incremento_por_dia,
                multa_dano_min, multa_dano_max, costo_membresia,
                dias_renovacion, limite_prestamos_sin_membresia,
                limite_prestamos_con_membresia, dias_suspension,
                libros_perdidos_bloqueo, meses_sin_pago_bloqueo
            ];
        } else {
            // UPDATE si ya existe
            query = `
                UPDATE configuracion_sistema SET
                    multa_primer_retraso = ?,
                    multa_reincidente = ?,
                    incremento_por_dia = ?,
                    multa_dano_min = ?,
                    multa_dano_max = ?,
                    costo_membresia = ?,
                    dias_renovacion = ?,
                    limite_prestamos_sin_membresia = ?,
                    limite_prestamos_con_membresia = ?,
                    dias_suspension = ?,
                    libros_perdidos_bloqueo = ?,
                    meses_sin_pago_bloqueo = ?,
                    fecha_actualizacion = NOW()
                WHERE id = ?
            `;
            params = [
                multa_primer_retraso, multa_reincidente, incremento_por_dia,
                multa_dano_min, multa_dano_max, costo_membresia,
                dias_renovacion, limite_prestamos_sin_membresia,
                limite_prestamos_con_membresia, dias_suspension,
                libros_perdidos_bloqueo, meses_sin_pago_bloqueo,
                results[0].id
            ];
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('Error al actualizar configuración:', err);
                return res.status(500).json({ 
                    error: 'Error al actualizar configuración',
                    detalles: err.message 
                });
            }
            
            res.json({ 
                mensaje: 'Configuración actualizada exitosamente',
                success: true 
            });
        });
    });
});

// ==========================================
// OBTENER HISTORIAL DE CAMBIOS
// ==========================================
router.get('/historial', (req, res) => {
    const query = `
        SELECT * FROM configuracion_sistema 
        ORDER BY fecha_actualizacion DESC 
        LIMIT 10
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener historial:', err);
            return res.status(500).json({ 
                error: 'Error al obtener historial',
                detalles: err.message 
            });
        }
        
        res.json(results);
    });
});

module.exports = router;