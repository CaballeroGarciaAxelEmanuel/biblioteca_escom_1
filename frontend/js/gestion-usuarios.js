// frontend/js/gestion-usuarios.js - VERSIÓN COMPLETA CORREGIDA

const API_URL = 'http://localhost:3000';

// 1. Cargar usuarios al abrir la página
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detalles || 'Error al cargar usuarios');
        }
        const data = await response.json();
        mostrarUsuarios(data);
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los usuarios. Error: ' + error.message);
    }
}

// 2. Mostrar usuarios en la tabla (COMPLETO CON BOTONES)
function mostrarUsuarios(data) {
    const tabla = document.getElementById('tabla-usuarios');
    if (!tabla) return;
    
    tabla.innerHTML = '';
    
    // Verificar si data.usuarios existe
    const usuarios = data.usuarios || data || [];
    
    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${usuario.rol_nombre || usuario.rol}</td>
            <td>
                <span class="badge-estado estado-${usuario.estado}">
                    ${usuario.estado_nombre || usuario.estado}
                </span>
            </td>
            <td>${new Date(usuario.fecha_registro).toLocaleDateString()}</td>
            <td>${usuario.libros_perdidos || 0}</td>
            <td>
                <div class="btn-group">
                    <button onclick="editarUsuario(${usuario.id})" class="btn btn-editar" title="Editar">
                        <i>✏️</i>
                    </button>
                    <button onclick="eliminarUsuario(${usuario.id})" class="btn btn-eliminar" title="Eliminar">
                        <i>🗑️</i>
                    </button>
                    <button onclick="cambiarEstadoUsuario(${usuario.id}, 'ACTIVO')" 
                            class="btn btn-activar" 
                            ${usuario.estado === 'ACTIVO' ? 'disabled' : ''}
                            title="Activar">
                        <i>✅</i>
                    </button>
                    <button onclick="cambiarEstadoUsuario(${usuario.id}, 'INACTIVO')" 
                            class="btn btn-desactivar" 
                            ${usuario.estado === 'INACTIVO' ? 'disabled' : ''}
                            title="Desactivar">
                        <i>⏸️</i>
                    </button>
                    <button onclick="cambiarEstadoUsuario(${usuario.id}, 'BLOQUEADO')" 
                            class="btn btn-bloquear" 
                            ${usuario.estado === 'BLOQUEADO' ? 'disabled' : ''}
                            title="Bloquear">
                        <i>🚫</i>
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

// 3. Cambiar estado de usuario
async function cambiarEstadoUsuario(id, nuevoEstado) {
    const estados = {
        'ACTIVO': 'activar',
        'INACTIVO': 'desactivar',
        'BLOQUEADO': 'bloquear'
    };
    
    const accion = estados[nuevoEstado] || 'cambiar estado';
    
    if (!confirm(`¿Está seguro de ${accion} este usuario?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                nuevoEstado: nuevoEstado,
                razon: `Cambio de estado por administrador - ${nuevoEstado}`
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || `Error al ${accion} usuario`);
        }
        
        alert(data.message || `Usuario ${accion}do correctamente.`);
        cargarUsuarios(); // Recargar lista
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

// 4. Editar usuario
function editarUsuario(id) {
    // Abrir modal o redirigir a formulario de edición
    alert(`Funcionalidad de edición para usuario ID: ${id}\n(Implementar modal de edición)`);
    
    // Ejemplo para implementar:
    // window.location.href = `editar-usuario.html?id=${id}`;
    // O abrir modal con fetch(`${API_URL}/usuarios/${id}`)
}

// 5. Eliminar usuario
async function eliminarUsuario(id) {
    if (!confirm('¿Está seguro de ELIMINAR PERMANENTEMENTE este usuario?\nEsta acción NO se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Error al eliminar usuario');
        }
        
        alert(data.message || 'Usuario eliminado correctamente.');
        cargarUsuarios(); // Recargar lista
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

// 6. Crear nuevo usuario
async function crearUsuario(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const usuario = Object.fromEntries(formData);
    
    // Validaciones básicas
    if (!usuario.nombre || !usuario.email || !usuario.rol) {
        alert('Los campos nombre, email y rol son obligatorios.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuario)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Error al crear usuario');
        }
        
        alert(`Usuario creado exitosamente.\nContraseña generada: ${data.passwordGenerada}`);
        form.reset();
        cargarUsuarios(); // Recargar la lista
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

// 7. Buscar usuarios
async function buscarUsuarios(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const params = new URLSearchParams(formData).toString();
    
    try {
        const response = await fetch(`${API_URL}/usuarios/buscar?${params}`);
        
        if (!response.ok) {
            throw new Error('Error al buscar usuarios');
        }
        
        const data = await response.json();
        mostrarUsuarios(data);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar usuarios: ' + error.message);
    }
}

// 8. Actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/usuarios/estadisticas`);
        if (!response.ok) return;
        
        const data = await response.json();
        const stats = data.estadisticas;
        
        // Actualizar elementos en el HTML
        const elementos = {
            'total-usuarios': stats.total,
            'total-admins': stats.total_admins,
            'total-bibliotecarios': stats.total_bibliotecarios,
            'total-lectores': stats.total_lectores,
            'usuarios-activos': stats.activos,
            'usuarios-inactivos': stats.inactivos,
            'usuarios-bloqueados': stats.bloqueados,
            'con-membresia': stats.con_membresia
        };
        
        for (const [id, valor] of Object.entries(elementos)) {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor || 0;
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// 9. Mostrar error
function mostrarError(mensaje) {
    const contenedor = document.querySelector('.contenedor-principal') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-mensaje';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        margin: 15px;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
    `;
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${mensaje}
        <br><small>Asegúrate de que el servidor Node.js esté corriendo en puerto 3000</small>
    `;
    contenedor.prepend(errorDiv);
    
    // Auto-eliminar después de 10 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 10000);
}

// 10. Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarios();
    
    // Asignar eventos a formularios si existen
    const formCrear = document.getElementById('form-crear-usuario');
    const formBuscar = document.getElementById('form-buscar-usuario');
    
    if (formCrear) {
        formCrear.addEventListener('submit', crearUsuario);
    }
    
    if (formBuscar) {
        formBuscar.addEventListener('submit', buscarUsuarios);
    }
    
    // Botón para recargar usuarios
    const btnRecargar = document.getElementById('btn-recargar');
    if (btnRecargar) {
        btnRecargar.addEventListener('click', cargarUsuarios);
    }
});

// Agregar funciones al scope global para que los botones HTML las puedan llamar
window.cargarUsuarios = cargarUsuarios;
window.cambiarEstadoUsuario = cambiarEstadoUsuario;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.crearUsuario = crearUsuario;
window.buscarUsuarios = buscarUsuarios;