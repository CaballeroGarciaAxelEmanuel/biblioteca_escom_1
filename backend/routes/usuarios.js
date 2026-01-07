const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// ============================================
// 1. OBTENER TODOS LOS USUARIOS
// ============================================
router.get('/', (req, res) => {
    const query = `
        SELECT id, nombre, email, rol, tiene_membresia, estado, 
               fecha_registro, ultimo_login, libros_perdidos,
               CASE 
                   WHEN rol = 'ADMIN' THEN 'Administrador'
                   WHEN rol = 'BIBLIOTECARIO' THEN 'Bibliotecario'
                   WHEN rol = 'LECTOR' THEN 'Lector'
               END as rol_nombre,
               CASE 
                   WHEN estado = 'ACTIVO' THEN 'Activo'
                   WHEN estado = 'INACTIVO' THEN 'Inactivo'
                   WHEN estado = 'BLOQUEADO' THEN 'Bloqueado'
               END as estado_nombre
        FROM usuarios
        ORDER BY fecha_registro DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json({ usuarios: results });
    });
});

// ============================================
// 2. CREAR NUEVO USUARIO (CON ENVÍO DE CORREO)
// ============================================
router.post('/', async (req, res) => {
    const { nombre, email, direccion, identificacion, rol } = req.body;
    
    console.log('📝 Creando usuario:', { nombre, email, rol });
    
    // ========= VALIDACIONES =========
    
    // ERR-02: Campos requeridos ausentes
    const camposRequeridos = [];
    if (!nombre || nombre.trim() === '') camposRequeridos.push('Nombre');
    if (!email || email.trim() === '') camposRequeridos.push('Correo electrónico');
    if (!rol || rol.trim() === '') camposRequeridos.push('Rol');
    
    if (camposRequeridos.length > 0) {
        return res.status(400).json({ 
            error: 'ERR-02',
            message: `ERROR_02: Campos requeridos ausentes: ${camposRequeridos.join(', ')}.` 
        });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            error: 'ERR-05',
            message: 'ERROR_05: El formato del correo electrónico no es válido.' 
        });
    }
    
    // Función para generar contraseña
    const generarContraseña = (nombre) => {
        const nombreBase = nombre.substring(0, 4).toLowerCase();
        const numeros = Math.floor(100 + Math.random() * 900);
        const simbolos = ['!', '@', '#', '$', '%', '&', '*'];
        const simbolo = simbolos[Math.floor(Math.random() * simbolos.length)];
        return nombreBase + numeros + simbolo;
    };
    
    // ========= FUNCIÓN PARA CREAR USUARIO EN BD =========
    const crearUsuarioEnBD = async () => {
        try {
            // 1. GENERAR CONTRASEÑA
            const password = generarContraseña(nombre);
            console.log('🔐 Contraseña generada:', password);
            
            // 2. VERIFICAR SI CORREO YA EXISTE
            db.query('SELECT id FROM usuarios WHERE email = ?', [email], async (err, emailResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                
                if (emailResults.length > 0) {
                    return res.status(400).json({ 
                        error: 'ERR-01',
                        message: 'ERROR_01: El correo electrónico ya existe. Por favor, ingrese uno diferente.' 
                    });
                }
                
                // 3. VALIDAR LÍMITE DE ADMINISTRADORES SI ES ADMIN
                if (rol === 'ADMIN') {
                    db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "ADMIN" AND estado = "ACTIVO"', 
                        async (err, adminResults) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ error: 'Error en la base de datos' });
                            }
                            
                            const totalAdminsActivos = adminResults[0]?.total || 0;
                            console.log(`Administradores activos actuales: ${totalAdminsActivos}`);
                            
                            if (totalAdminsActivos >= 2) {
                                return res.status(400).json({ 
                                    error: 'ERR-03',
                                    message: 'ERROR_03: No se puede crear la cuenta. Se ha alcanzado el límite de 2 Administradores.' 
                                });
                            }
                            
                            // 4. INSERTAR USUARIO
                            await insertarUsuario(password);
                        });
                } else {
                    // 4. INSERTAR USUARIO (no admin)
                    await insertarUsuario(password);
                }
            });
            
        } catch (error) {
            console.error('Error en crearUsuarioEnBD:', error);
            return res.status(500).json({ 
                error: 'ERR-06',
                message: 'ERROR_06: Error interno del servidor.' 
            });
        }
    };
    
    // ========= FUNCIÓN PARA INSERTAR USUARIO =========
    const insertarUsuario = async (password) => {
        const query = `
            INSERT INTO usuarios (nombre, email, password, direccion, identificacion, rol, tiene_membresia, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
        `;
        
        const tieneMembresia = rol === 'LECTOR' ? false : true;
        
        db.query(query, [nombre, email, password, direccion || '', identificacion || '', rol, tieneMembresia], 
            async (err, results) => {
                if (err) {
                    console.error('Error insertando usuario:', err);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                
                const usuarioId = results.insertId;
                console.log(`✅ Usuario creado con ID: ${usuarioId}`);
                
                // ========= ENVÍO DE CORREO ELECTRÓNICO =========
                let correoEnviado = false;
                let errorCorreo = null;
                
                try {
                    // Intentar cargar el servicio de correo
                    const { enviarContraseñaUsuario } = require('../utils/email-simple');
                    
                    // Enviar correo al USUARIO (no al admin)
                    const resultadoCorreo = await enviarContraseñaUsuario(
                        email,        // Correo DEL USUARIO
                        nombre,       // Nombre del usuario
                        password,     // Contraseña generada
                        rol           // Rol asignado
                    );
                    
                    correoEnviado = resultadoCorreo.enviado;
                    errorCorreo = resultadoCorreo.error;
                    
                } catch (emailError) {
                    console.warn('⚠️  Error cargando servicio de correo:', emailError.message);
                    errorCorreo = emailError.message;
                }
                
                // ========= PREPARAR RESPUESTA =========
                const respuesta = {
                    success: true,
                    message: 'MSJ-01: Éxito: La cuenta de usuario fue gestionada correctamente y los cambios han sido guardados.',
                    usuarioId: usuarioId,
                    datosUsuario: {
                        nombre,
                        email,
                        rol
                    },
                    correoEnviado: correoEnviado
                };
                
                // Personalizar mensaje según resultado del correo
                if (correoEnviado) {
                    respuesta.detalleCorreo = `✅ Las credenciales fueron enviadas a: ${email}`;
                } else {
                    // SI FALLA EL CORREO, mostrar la contraseña en la respuesta
                    respuesta.passwordGenerada = password;
                    respuesta.advertencia = `⚠️ NO se pudo enviar el correo a ${email}. Contraseña generada: ${password}`;
                    respuesta.errorCorreo = errorCorreo;
                    
                    console.log(`⚠️  IMPORTANTE: Guarda esta contraseña para ${nombre}: ${password}`);
                }
                
                res.json(respuesta);
            });
    };
    
    // Iniciar el proceso de creación
    await crearUsuarioEnBD();
});

// ============================================
// 3. ACTUALIZAR USUARIO 
// ============================================
router.put('/:id', (req, res) => {
    const userId = req.params.id;
    const { nombre, email, direccion, identificacion, rol, tiene_membresia, estado } = req.body;
    
    console.log('Actualizando usuario ID:', userId, req.body);
    
    // Verificar si el usuario existe
    db.query('SELECT * FROM usuarios WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                error: 'ERR-04',
                message: 'ERROR_04: Usuario no encontrado. Verifique el criterio de búsqueda.' 
            });
        }
        
        const usuarioActual = results[0];
        
        // Si está cambiando a ADMIN, verificar límite
        if (rol === 'ADMIN' && usuarioActual.rol !== 'ADMIN') {
            db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "ADMIN" AND estado = "ACTIVO" AND id != ?', 
                [userId], (err, adminResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error en la base de datos' });
                    }
                    
                    const totalAdminsActivos = adminResults[0]?.total || 0;
                    if (totalAdminsActivos >= 2) {
                        return res.status(400).json({ 
                            error: 'ERR-03',
                            message: 'No se puede cambiar a Administrador. Límite de 2 alcanzado.' 
                        });
                    }
                    
                    continuarActualizacion();
                });
        } else {
            continuarActualizacion();
        }
        
        function continuarActualizacion() {
            // Verificar si el nuevo correo ya existe (excepto para el mismo usuario)
            if (email && email !== usuarioActual.email) {
                db.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, userId], (err, emailResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error en la base de datos' });
                    }
                    
                    if (emailResults.length > 0) {
                        return res.status(400).json({ 
                            error: 'ERR-01',
                            message: 'ERROR_01: El correo electrónico ya existe. Por favor, ingrese uno diferente.' 
                        });
                    }
                    
                    actualizarUsuario();
                });
            } else {
                actualizarUsuario();
            }
        }
        
        function actualizarUsuario() {
            const query = `
                UPDATE usuarios 
                SET nombre = ?, email = ?, direccion = ?, identificacion = ?, 
                    rol = ?, tiene_membresia = ?, estado = ?
                WHERE id = ?
            `;
            
            db.query(query, [nombre, email, direccion || '', identificacion || '', rol, tiene_membresia, estado, userId], 
                (err, results) => {
                    if (err) {
                        console.error('Error actualizando usuario:', err);
                        return res.status(500).json({ error: 'Error en la base de datos' });
                    }
                    
                    res.json({ 
                        success: true,
                        message: 'MSJ-01: Éxito: La cuenta de usuario fue gestionada correctamente y los cambios han sido guardados.'
                    });
                });
        }
    });
});

// ============================================
// 4. CAMBIAR ESTADO DE USUARIO
// ============================================
router.patch('/:id/estado', (req, res) => {
    const userId = req.params.id;
    const { nuevoEstado, razon } = req.body;
    
    console.log(`Cambiando estado usuario ${userId} a: ${nuevoEstado}`);
    
    // Validar estado
    const estadosValidos = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }
    
    // Verificar si el usuario existe
    db.query('SELECT * FROM usuarios WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                error: 'ERR-04',
                message: 'ERROR_04: Usuario no encontrado. Verifique el criterio de búsqueda.' 
            });
        }
        
        const usuario = results[0];
        
        // Si está activando un ADMIN, verificar límite
        if (nuevoEstado === 'ACTIVO' && usuario.rol === 'ADMIN') {
            db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = "ADMIN" AND estado = "ACTIVO" AND id != ?', 
                [userId], (err, adminResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error en la base de datos' });
                    }
                    
                    const totalAdminsActivos = adminResults[0]?.total || 0;
                    if (totalAdminsActivos >= 2) {
                        return res.status(400).json({ 
                            error: 'ERR-03',
                            message: 'No se puede activar. Límite de 2 administradores activos alcanzado.' 
                        });
                    }
                    
                    cambiarEstado();
                });
        } else {
            cambiarEstado();
        }
        
        function cambiarEstado() {
            const query = `
                UPDATE usuarios 
                SET estado = ?, razon_bloqueo = ?
                WHERE id = ?
            `;
            
            db.query(query, [nuevoEstado, razon || '', userId], (err, results) => {
                if (err) {
                    console.error('Error cambiando estado:', err);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                
                let mensaje = '';
                switch(nuevoEstado) {
                    case 'ACTIVO': 
                        mensaje = 'Usuario activado correctamente.';
                        break;
                    case 'INACTIVO': 
                        mensaje = 'Usuario desactivado correctamente.';
                        break;
                    case 'BLOQUEADO': 
                        mensaje = 'Usuario bloqueado correctamente.';
                        break;
                }
                
                res.json({ 
                    success: true,
                    message: mensaje
                });
            });
        }
    });
});

// ============================================
// 5. ELIMINAR USUARIO
// ============================================
router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    
    console.log('Eliminando usuario ID:', userId);
    
    // Verificar si el usuario existe
    db.query('SELECT * FROM usuarios WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                error: 'ERR-04',
                message: 'ERROR_04: Usuario no encontrado. Verifique el criterio de búsqueda.' 
            });
        }
        
        const usuario = results[0];
        
        // Eliminar físicamente
        db.query('DELETE FROM usuarios WHERE id = ?', [userId], (err, results) => {
            if (err) {
                console.error('Error eliminando usuario:', err);
                return res.status(500).json({ error: 'Error en la base de datos' });
            }
            
            res.json({ 
                success: true,
                message: 'Usuario eliminado correctamente.'
            });
        });
    });
});

// ============================================
// 6. BUSCAR USUARIOS
// ============================================
router.get('/buscar', (req, res) => {
    const { termino, rol, estado } = req.query;
    
    console.log('Buscando usuarios con filtros:', { termino, rol, estado });
    
    let query = `
        SELECT id, nombre, email, rol, tiene_membresia, estado, fecha_registro,
               CASE 
                   WHEN rol = 'ADMIN' THEN 'Administrador'
                   WHEN rol = 'BIBLIOTECARIO' THEN 'Bibliotecario'
                   WHEN rol = 'LECTOR' THEN 'Lector'
               END as rol_nombre
        FROM usuarios
        WHERE 1=1
    `;
    const params = [];
    
    if (termino && termino.trim() !== '') {
        query += ` AND (nombre LIKE ? OR email LIKE ?)`;
        params.push(`%${termino}%`, `%${termino}%`);
    }
    
    if (rol && rol !== '') {
        query += ` AND rol = ?`;
        params.push(rol);
    }
    
    if (estado && estado !== '') {
        query += ` AND estado = ?`;
        params.push(estado);
    }
    
    query += ` ORDER BY nombre`;
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error buscando usuarios:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json({ usuarios: results });
    });
});

// ============================================
// 7. OBTENER ESTADÍSTICAS
// ============================================
router.get('/estadisticas', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN rol = 'ADMIN' THEN 1 ELSE 0 END) as total_admins,
            SUM(CASE WHEN rol = 'BIBLIOTECARIO' THEN 1 ELSE 0 END) as total_bibliotecarios,
            SUM(CASE WHEN rol = 'LECTOR' THEN 1 ELSE 0 END) as total_lectores,
            SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
            SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
            SUM(CASE WHEN estado = 'BLOQUEADO' THEN 1 ELSE 0 END) as bloqueados,
            SUM(CASE WHEN tiene_membresia = TRUE THEN 1 ELSE 0 END) as con_membresia
        FROM usuarios
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo estadísticas:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json({ estadisticas: results[0] });
    });
});

module.exports = router;