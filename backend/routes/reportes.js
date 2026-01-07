const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const PDFDocument = require('pdfkit');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

/* ===============================
   OBTENER REPORTES MENSUALES (JSON)
================================ */
router.get('/mensual', async (req, res) => {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
        return res.status(400).json({
            success: false,
            message: 'Mes y año son requeridos'
        });
    }

    try {
        // 1. PRÉSTAMOS
        const [[prestamos]] = await db.promise().query(
            `SELECT COUNT(*) as total FROM prestamos
             WHERE MONTH(fecha_prestamo)=? AND YEAR(fecha_prestamo)=?`,
            [mes, anio]
        );

        // 2. LIBROS DAÑADOS
        const [[danados]] = await db.promise().query(
            `SELECT COUNT(*) as total FROM multas
             WHERE tipo='DANIO' AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        // 3. LIBROS PERDIDOS
        const [[perdidos]] = await db.promise().query(
            `SELECT COUNT(*) as total FROM multas
             WHERE tipo='PERDIDA' AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        // 4. NUEVOS USUARIOS
        const [[usuarios]] = await db.promise().query(
            `SELECT COUNT(*) as total FROM usuarios
             WHERE MONTH(fecha_registro)=? AND YEAR(fecha_registro)=?`,
            [mes, anio]
        );

        // 5. MULTAS RECAUDADAS
        const [[recaudado]] = await db.promise().query(
            `SELECT COALESCE(SUM(monto), 0) as total FROM multas
             WHERE estado='PAGADA'
             AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        res.json({
            success: true,
            mes: parseInt(mes),
            anio: parseInt(anio),
            prestamos: { total: prestamos.total || 0 },
            libros: {
                danados: danados.total || 0,
                perdidos: perdidos.total || 0
            },
            usuarios: { nuevos: usuarios.total || 0 },
            multas: { recaudado: recaudado.total || 0 }
        });

    } catch (error) {
        console.error('Error obteniendo reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el reporte'
        });
    }
});

/* ===============================
   GENERAR PDF DEL REPORTE
================================ */
router.get('/mensual/pdf', async (req, res) => {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
        return res.status(400).json({ error: 'Mes y año requeridos' });
    }

    try {
        console.log(`Generando PDF para ${mes}/${anio}...`);

        // Obtener datos
        const [[prestamos]] = await db.promise().query(
            `SELECT COUNT(*) total FROM prestamos
             WHERE MONTH(fecha_prestamo)=? AND YEAR(fecha_prestamo)=?`,
            [mes, anio]
        );

        const [[danados]] = await db.promise().query(
            `SELECT COUNT(*) total FROM multas
             WHERE tipo='DANIO' AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        const [[perdidos]] = await db.promise().query(
            `SELECT COUNT(*) total FROM multas
             WHERE tipo='PERDIDA' AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        const [[usuarios]] = await db.promise().query(
            `SELECT COUNT(*) total FROM usuarios
             WHERE MONTH(fecha_registro)=? AND YEAR(fecha_registro)=?`,
            [mes, anio]
        );

        const [[recaudado]] = await db.promise().query(
            `SELECT COALESCE(SUM(monto), 0) total FROM multas
             WHERE estado='PAGADA'
             AND MONTH(fecha_multa)=? AND YEAR(fecha_multa)=?`,
            [mes, anio]
        );

        /* ===== GENERAR GRÁFICA ===== */
        const chartCanvas = new ChartJSNodeCanvas({ 
            width: 600, 
            height: 400,
            backgroundColour: 'white'
        });

        const chartImage = await chartCanvas.renderToBuffer({
            type: 'bar',
            data: {
                labels: ['Prestamos', 'Danados', 'Perdidos', 'Nuevos Usuarios'],
                datasets: [{
                    label: 'Cantidad',
                    data: [
                        prestamos.total || 0,
                        danados.total || 0,
                        perdidos.total || 0,
                        usuarios.total || 0
                    ],
                    backgroundColor: [
                        'rgba(25, 118, 210, 0.8)',
                        'rgba(249, 168, 37, 0.8)',
                        'rgba(211, 47, 47, 0.8)',
                        'rgba(56, 142, 60, 0.8)'
                    ],
                    borderColor: [
                        'rgb(25, 118, 210)',
                        'rgb(249, 168, 37)',
                        'rgb(211, 47, 47)',
                        'rgb(56, 142, 60)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Reporte Mensual ${mes}/${anio}`,
                        font: { size: 18 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        /* ===== CREAR PDF ===== */
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'LETTER'
        });

        // Intentar usar DejaVuSans, si no existe usar Helvetica
        try {
            const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
            const fs = require('fs');
            
            if (fs.existsSync(fontPath)) {
                doc.registerFont('dejavu', fontPath);
                doc.font('dejavu');
                console.log('Usando fuente DejaVuSans');
            } else {
                doc.font('Helvetica');
                console.log('Usando fuente Helvetica (sin acentos)');
            }
        } catch (err) {
            doc.font('Helvetica');
            console.log('Fuente no encontrada, usando Helvetica');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=reporte-${mes}-${anio}.pdf`
        );

        doc.pipe(res);

        // ===== ENCABEZADO =====
        doc.fontSize(24)
           .fillColor('#00447c')
           .text('Reporte Mensual', { align: 'center' });
        
        doc.fontSize(18)
           .fillColor('#333')
           .text('Biblioteca ESCOM - IPN', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(14)
           .fillColor('#666')
           .text(`Periodo: ${obtenerNombreMes(mes)}/${anio}`, { align: 'center' });
        
        doc.moveDown(2);

        // ===== LÍNEA DIVISORIA =====
        doc.strokeColor('#00447c')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        
        doc.moveDown();

        // ===== ESTADÍSTICAS (SIN EMOJIS) =====
        doc.fontSize(16)
           .fillColor('#00447c')
           .text('Estadisticas del Periodo', { underline: true });
        
        doc.moveDown();

        const stats = [
            { label: 'Prestamos realizados', value: prestamos.total || 0 },
            { label: 'Libros danados', value: danados.total || 0 },
            { label: 'Libros perdidos', value: perdidos.total || 0 },
            { label: 'Nuevos usuarios', value: usuarios.total || 0 },
            { label: 'Multas recaudadas', value: `$${recaudado.total || 0} MXN` }
        ];

        doc.fontSize(12).fillColor('#333');
        
        stats.forEach((stat, index) => {
            doc.text(`${index + 1}. ${stat.label}:`, 80, doc.y, { continued: true })
               .fillColor('#00447c')
               .text(`  ${stat.value}`, { align: 'left' })
               .fillColor('#333');
            doc.moveDown(0.8);
        });

        doc.moveDown(2);

        // ===== GRÁFICA =====
        doc.fontSize(16)
           .fillColor('#00447c')
           .text('Grafica de Resultados', { align: 'center' });
        
        doc.moveDown();
        
        const imgWidth = 500;
        const imgHeight = 333;
        const imgX = (doc.page.width - imgWidth) / 2;
        
        doc.image(chartImage, imgX, doc.y, {
            fit: [imgWidth, imgHeight],
            align: 'center'
        });

        doc.moveDown(10);

        // ===== FOOTER =====
        doc.fontSize(10)
           .fillColor('#999')
           .text('_______________________________________________', { align: 'center' });
        
        doc.fontSize(9)
           .text(`Generado: ${new Date().toLocaleString('es-MX')}`, { align: 'center' })
           .text('Sistema de Gestion Bibliotecaria - ESCOM IPN', { align: 'center' })
           .text('Version 1.0 | Uso exclusivo institucional', { align: 'center' });

        doc.end();
        console.log('PDF generado exitosamente');

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ 
            error: 'Error generando PDF',
            detalles: error.message 
        });
    }
});

/* ===============================
   FUNCIÓN AUXILIAR
================================ */
function obtenerNombreMes(numeroMes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[parseInt(numeroMes) - 1] || 'Desconocido';
}

module.exports = router;