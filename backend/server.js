// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const configuracionRoutes = require('./routes/configuracion');
const app = express();
const PORT process.env.PORT = 3000;

/* ===== CORS (primero) ===== */
app.use(cors({
    origin: '*',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== SERVIR FRONTEND ===== */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ===== RUTAS API ===== */
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/materiales', require('./routes/materiales'));
app.use('/api/multas', require('./routes/multas'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/quejas', require('./routes/quejas'));
app.use('/api/configuracion', configuracionRoutes);

/* ===== LOGIN ===== */
app.post('/api/auth/login', (req, res) => {
    const db = require('./database/connection');
    const { email, password } = req.body;

    db.query(
        'SELECT * FROM usuarios WHERE email=? AND password=?',
        [email, password],
        (err, rows) => {
            if (err) return res.json({ success: false });
            if (!rows.length) return res.json({ success: false });

            res.json({
                success: true,
                usuario: rows[0],
                token: 'demo-token'
            });
        }
    );
});

/* ===== 404 ===== */
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend + Frontend en http://localhost:${PORT}`);
});

