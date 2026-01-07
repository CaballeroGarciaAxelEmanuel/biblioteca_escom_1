const mailConfig = {
    service: 'gmail',
    auth: {
        user: 'sistema.biblioteca.escom@gmail.com', // TU correo emisor
        pass: 'oejz jjbn mcjt txog'   // Tu contraseña de app
    }
};

const emailTemplates = {
    credenciales: (nombre, emailDestino, password, rol) => ({
        subject: `🔐 Tu cuenta en Biblioteca ESCOM está lista`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>¡Hola ${nombre}!</h2>
                <p>Tu cuenta en el <strong>Sistema de Biblioteca ESCOM</strong> ha sido creada.</p>
                
                <div style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #00447c; margin-top: 0;">📋 Tus datos de acceso:</h3>
                    
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0;"><strong>Usuario/Correo:</strong></td>
                            <td style="padding: 8px 0;">${emailDestino}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Contraseña temporal:</strong></td>
                            <td style="padding: 8px 0;">
                                <div style="background: #00447c; color: white; padding: 10px 15px; border-radius: 5px; font-family: monospace; font-size: 18px; letter-spacing: 2px; text-align: center;">
                                    ${password}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Rol asignado:</strong></td>
                            <td style="padding: 8px 0;">
                                <span style="background: #6c757d; color: white; padding: 4px 10px; border-radius: 15px; font-size: 12px;">
                                    ${rol === 'ADMIN' ? 'Administrador' : rol === 'BIBLIOTECARIO' ? 'Bibliotecario' : 'Lector'}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #e7f3ff; border-left: 4px solid #00447c; padding: 15px; margin: 20px 0;">
                    <h4 style="margin-top: 0;">🚀 ¿Cómo ingresar?</h4>
                    <ol>
                        <li>Ve a: <a href="http://localhost:3000" style="color: #00447c; font-weight: bold;">http://biblioteca.escom.ipn.mx</a></li>
                        <li>Usa el correo: <strong>${emailDestino}</strong></li>
                        <li>Usa la contraseña: <strong>${password}</strong></li>
                        <li><strong style="color: #dc3545;">IMPORTANTE:</strong> Cambia tu contraseña después de entrar</li>
                    </ol>
                    
                    <a href="http://localhost:3000" style="display: inline-block; background: #00447c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                        🔗 Entrar al sistema ahora
                    </a>
                </div>
                
                <div style="border-top: 1px solid #dee2e6; padding-top: 15px; color: #6c757d; font-size: 12px;">
                    <p>📍 <strong>ESCOM - IPN</strong><br>
                    Escuela Superior de Cómputo<br>
                    Instituto Politécnico Nacional</p>
                    <p>Este es un correo automático, por favor no responder.</p>
                </div>
            </div>
        `
    })
};

module.exports = { mailConfig, emailTemplates };