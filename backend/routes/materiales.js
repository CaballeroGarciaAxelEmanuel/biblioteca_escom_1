// backend/routes/materiales.js
const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ============================================
// 1. OBTENER TODOS LOS MATERIALES
// ============================================
router.get('/', async (req, res) => {
    try {
        const [materiales] = await db.promise().query(
            'SELECT * FROM materiales ORDER BY titulo'
        );
        
        res.json({
            success: true,
            materiales: materiales
        });
        
    } catch (error) {
        console.error('Error obteniendo materiales:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo materiales'
        });
    }
});

// ============================================
// 2. BUSCAR MATERIALES POR TÉRMINO
// ============================================
router.get('/buscar', async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.json({ success: true, materiales: [] });
    }

    const [rows] = await db.promise().query(
        `
        SELECT id, titulo, autor, editorial, categoria, valor
        FROM materiales
        WHERE
          CONVERT(titulo USING utf8mb4)
            COLLATE utf8mb4_general_ci LIKE CONCAT('%', ?, '%')
          OR CONVERT(autor USING utf8mb4)
            COLLATE utf8mb4_general_ci LIKE CONCAT('%', ?, '%')
          OR isbn LIKE CONCAT('%', ?, '%')
        ORDER BY titulo
        LIMIT 20
        `,
        [q, q, q]
    );

    res.json({ success: true, materiales: rows });
});

// ============================================
// 3. OBTENER MATERIAL POR ID
// ============================================
router.get('/:id', async (req, res) => {
    const materialId = req.params.id;
    
    try {
        const [material] = await db.promise().query(
            'SELECT * FROM materiales WHERE id = ?',
            [materialId]
        );
        
        if (material.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Material no encontrado'
            });
        }
        
        res.json({
            success: true,
            material: material[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo material:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo material'
        });
    }
});

module.exports = router;
