const nodemailer = require('nodemailer');
const { mailConfig, emailTemplates } = require('../config/mail.config');

// Configurar el transporter con TU correo
const transporter = nodemailer.createTransport(mailConfig);

// Función para enviar al CORREO DEL USUARIO
async function enviarContraseñaUsuario(destinatario, nombre, password, rol) {
    console.log(`✉️  ENVIANDO contraseña a: ${destinatario}`);
    console.log(`   Nombre: ${nombre}, Rol: ${rol}`);
    console.log(`   Contraseña generada: ${password}`);
    
    const template = emailTemplates.credenciales(nombre, destinatario, password, rol);
    
    const mailOptions = {
        from: {
            name: 'Sistema Biblioteca ESCOM',
            address: mailConfig.auth.user  // TU correo como remitente
        },
        to: destinatario,  // Correo DEL USUARIO que registraste
        subject: template.subject,
        html: template.html,
        text: `Hola ${nombre},\n\nTu cuenta ha sido creada.\nCorreo: ${destinatario}\nContraseña: ${password}\nRol: ${rol}\n\nAccede en: http://localhost:3000\n\nCambia tu contraseña después de entrar.`
    };
    
    try {
        console.log(`   ⏳ Enviando desde: ${mailConfig.auth.user} → ${destinatario}`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`   ✅ ENVIADO a ${destinatario}`);
        console.log(`   📫 ID del mensaje: ${info.messageId}`);
        console.log(`   📊 Respuesta: ${info.response}`);
        
        return {
            enviado: true,
            destinatario: destinatario,
            messageId: info.messageId
        };
        
    } catch (error) {
        console.error(`   ❌ ERROR enviando a ${destinatario}:`);
        console.error(`   📌 Error: ${error.message}`);
        
        // Mostrar ayuda específica
        if (error.code === 'EAUTH') {
            console.error(`
            ⚠️  PROBLEMA DE AUTENTICACIÓN:
            ------------------------------------
            1. Verifica que '${mailConfig.auth.user}' existe
            2. Activa "Verificación en 2 pasos" en ese Gmail
            3. Genera una "CONTRASEÑA DE APLICACIÓN" de 16 caracteres
            4. NO uses tu contraseña normal de Gmail
            5. Usa esa contraseña en mail.config.js
            ------------------------------------
            `);
        }
        
        return {
            enviado: false,
            destinatario: destinatario,
            error: error.message
        };
    }
}

module.exports = { enviarContraseñaUsuario };