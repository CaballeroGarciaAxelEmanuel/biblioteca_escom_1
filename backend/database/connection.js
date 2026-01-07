const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'biblioteca_escom',
    charset: 'utf8mb4'   
});

connection.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
    } else {
        console.log('✅ Conectado a MySQL (utf8mb4)');
    }
});

module.exports = connection;
