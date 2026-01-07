const API_URL = 'http://localhost:3000';

/* ===============================
   CONSULTAR REPORTE MENSUAL
================================ */
async function consultarReporte() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;
    const errorDiv = document.getElementById('error');

    errorDiv.textContent = '';

    try {
        console.log('📡 Consultando reporte...', mes, anio);

        const res = await fetch(
            `${API_URL}/api/reportes/mensual?mes=${mes}&anio=${anio}`
        );

        if (!res.ok) {
            throw new Error('Respuesta no válida del servidor');
        }

        const data = await res.json();
        console.log('✅ Respuesta API:', data);

        if (!data.success) {
            errorDiv.textContent = data.message;
            return;
        }

        document.getElementById('prestamos').textContent = data.prestamos.total;
        document.getElementById('danados').textContent = data.libros.danados;
        document.getElementById('perdidos').textContent = data.libros.perdidos;
        document.getElementById('usuarios').textContent = data.usuarios.nuevos;
        document.getElementById('recaudado').textContent =
            `$${data.multas.recaudado}`;

    } catch (error) {
        console.error('❌ Error:', error);
        errorDiv.textContent = 'Error de conexión con el servidor';
    }
}

/* ===============================
   VOLVER AL DASHBOARD
================================ */
function irDashboard() {
    window.location.href = 'dashboard-admin.html';
}

/* ===============================
   CERRAR SESIÓN
================================ */
function logout() {
    if (confirm('¿Desea cerrar sesión?')) {
        localStorage.removeItem('biblioteca_user');
        localStorage.removeItem('biblioteca_token');
        localStorage.removeItem('biblioteca_login_time');
        window.location.href = 'index.html';
    }
}

/* ===============================
   VALIDAR SESIÓN ADMIN
================================ */
(function validarSesion() {
    const user = localStorage.getItem('biblioteca_user');
    const token = localStorage.getItem('biblioteca_token');

    if (!user || !token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const userData = JSON.parse(user);
        if (userData.rol !== 'ADMIN') {
            window.location.href = 'index.html';
        }
    } catch {
        localStorage.clear();
        window.location.href = 'index.html';
    }
})();

function descargarPDF() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;

    if (!mes || !anio) {
        alert('Seleccione mes y año');
        return;
    }

    const url = `http://localhost:3000/api/reportes/mensual/pdf?mes=${mes}&anio=${anio}`;

    // Forzar descarga
    window.open(url, '_blank');
}

function descargarPDF() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;

    window.open(
        `http://localhost:3000/api/reportes/mensual/pdf?mes=${mes}&anio=${anio}`,
        '_blank'
    );
}



