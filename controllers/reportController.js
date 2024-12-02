// controllers/reportController.js

const Report = require('../models/Report');
const OpenAI = require('openai');
require('dotenv').config(); // Carga las variables de entorno

// Configura tu clave de API de OpenAI utilizando variables de entorno
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Crear un nuevo reporte
exports.createReport = async (req, res) => {
    try {
        const { title, description, reportType, transactions, event, trainer, client, lead, attachedFiles } = req.body;
        const newReport = new Report({
            title,
            description,
            reportType,
            transactions,
            event,
            trainer,
            client,
            lead,
            attachedFiles,
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        res.status(500).json({ error: 'Error creando el reporte', details: err.message });
    }
};

// Obtener todos los reportes
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find({ trainer: req.user.id }).populate('transactions event trainer client lead');
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo los reportes', details: err.message });
    }
};

// Generar insights automáticos
exports.generateInsights = async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await Report.findById(reportId).populate('transactions');

        if (!report) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        // Preparar datos para OpenAI
        const prompt = `
            Reporte: ${report.title}
            Tipo: ${report.reportType}
            Descripción: ${report.description}
            Transacciones: ${report.transactions.map(t => t.toString()).join(', ')}

            Por favor, genera un análisis detallado basado en estos datos. Incluye insights relevantes y recomendaciones.
        `;

        // Realizar la llamada a OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Eres un asistente experto en análisis de datos.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
            n: 1
        });

        const insights = completion.choices[0].message.content.trim();

        res.status(200).json({ insights });
    } catch (err) {
        res.status(500).json({ error: 'Error generando insights', details: err.message });
    }
};

// Generar preview del reporte usando OpenAI
exports.generateReportPreview = async (req, res) => {
    try {
        const { 
            trainer, 
            clientes, 
            ingresos, 
            gastos, 
            servicios, 
            tipoReporte // 'semanal' o 'mensual'
        } = req.body;

        // Formatear los datos para el prompt
        const clientesStr = clientes?.length > 0 ? clientes.map(c => `- ${c.nombre}`).join('\n') : '[No hay datos de clientes]';
        const ingresosStr = ingresos?.length > 0 ? ingresos.map(i => `- ${i.monto} ${i.moneda}: ${i.descripcion}`).join('\n') : '[No hay datos de ingresos]';
        const gastosStr = gastos?.length > 0 ? gastos.map(g => `- ${g.importe} ${g.moneda}: ${g.descripcion}`).join('\n') : '[No hay datos de gastos]';
        const serviciosStr = servicios?.length > 0 ? servicios.map(s => `- ${s.nombre}: ${s.descripcion}`).join('\n') : '[No hay datos de servicios]';

        const prompt = `Como asistente de inteligencia artificial, necesito que generes un reporte de negocios ${tipoReporte} para el entrenador personal ${trainer.nombre}. El reporte debe basarse en la siguiente información:

Clientes:
${clientesStr}

Ingresos:
${ingresosStr}

Gastos:
${gastosStr}

Servicios:
${serviciosStr}

Instrucciones para el reporte:
Saludo Personalizado: Inicia el reporte con un saludo dirigido a ${trainer.nombre}.
Resumen Ejecutivo: Proporciona un resumen general del desempeño durante el período indicado.
Análisis Detallado:
Clientes: Analiza el crecimiento o disminución en la base de clientes, menciona clientes destacados si es relevante.
Ingresos: Desglosa las fuentes de ingresos y comenta sobre tendencias o variaciones significativas.
Gastos: Detalla los gastos y su impacto en la rentabilidad.
Servicios: Evalúa el rendimiento de los servicios ofrecidos y su aceptación por parte de los clientes.
Conclusiones y Recomendaciones: Ofrece conclusiones basadas en los datos y sugiere estrategias para mejorar el negocio.
Tono y Estilo: Mantén un tono profesional, motivador y orientado al crecimiento personal y empresarial.`;

        // Realizar la llamada a OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { 
                    role: 'system', 
                    content: 'Eres un asistente experto en análisis de negocios para entrenadores personales, con amplia experiencia en redacción de reportes ejecutivos.' 
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            max_tokens: 1500,
            temperature: 0.7,
            n: 1
        });

        const reportPreview = completion.choices[0].message.content.trim();

        res.status(200).json({ 
            preview: reportPreview,
            metadata: {
                tipoReporte,
                fechaGeneracion: new Date(),
                trainer: trainer.nombre,
                datosIncluidos: {
                    tieneClientes: clientes?.length > 0,
                    tieneIngresos: ingresos?.length > 0,
                    tieneGastos: gastos?.length > 0,
                    tieneServicios: servicios?.length > 0
                }
            }
        });

    } catch (err) {
        console.error('Error generando preview del reporte:', err);
        res.status(500).json({ 
            error: 'Error generando preview del reporte', 
            details: err.message 
        });
    }
};

// **Nueva Función: Eliminar Todos los Reportes del Entrenador Autenticado**
exports.deleteAllReportsByTrainer = async (req, res) => {
    try {
        const trainerId = req.user.id; // Asumiendo que el middleware de autenticación adjunta el ID del usuario a req.user

        const result = await Report.deleteMany({ trainer: trainerId });

        res.status(200).json({
            message: `Se han eliminado ${result.deletedCount} reporte(s) del entrenador con ID ${trainerId}.`,
        });
    } catch (err) {
        res.status(500).json({ error: 'Error eliminando los reportes', details: err.message });
    }
};
