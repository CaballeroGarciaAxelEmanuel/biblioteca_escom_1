// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Ruta de login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Intento de login:', email);
    
    // Validar campos
    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email y contraseña son requeridos' 
        });
    }
    
    // Buscar usuario
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ 
                error: 'Error en el servidor' 
            });
        }
        
        // Verificar si existe el usuario
        if (results.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales incorrectas' 
            });
        }
        
        const usuario = results[0];
        
        // Verificar contraseña (en texto plano por ahora)
        if (usuario.password !== password) {
            return res.status(401).json({ 
                error: 'Credenciales incorrectas' 
            });
        }
        
        // Verificar que el usuario esté activo
        if (usuario.estado !== 'ACTIVO') {
            return res.status(403).json({ 
                error: `Usuario ${usuario.estado.toLowerCase()}. Contacte al administrador.` 
            });
        }
        
        // Actualizar último login
        db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [usuario.id]);
        
        // Crear respuesta (en producción usaríamos JWT)
        const usuarioRespuesta = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            tiene_membresia: usuario.tiene_membresia
        };
        
        console.log(`✅ Login exitoso: ${usuario.nombre} (${usuario.rol})`);
        
        res.json({
            success: true,
            message: 'Login exitoso',
            usuario: usuarioRespuesta,
            // En producción usaríamos un token JWT
            token: 'simulado-por-ahora'
        });
    });
});

// Ruta para verificar sesión
router.get('/verify', (req, res) => {
    // En producción verificaríamos un token JWT
    res.json({ 
        success: true, 
        message: 'Sistema de autenticación funcionando' 
    });
});

// Ruta para logout
router.post('/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Sesión cerrada' 
    });
});

module.exports = router;