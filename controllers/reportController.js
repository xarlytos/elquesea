// controllers/reportController.js

const Report = require('../models/Report');
const OpenAI = require('openai');
require('dotenv').config(); // Carga las variables de entorno

// Configuración de OpenAI
const configuration = new OpenAI.Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Usa variables de entorno para mayor seguridad
});
const openai = new OpenAI.OpenAIApi(configuration);

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
        const reports = await Report.find().populate('transactions event trainer client lead');
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
        const openaiResponse = await openai.createChatCompletion({
            model: 'gpt-4', // Usa 'gpt-3.5-turbo' si no tienes acceso a GPT-4
            messages: [
                { role: 'system', content: 'Eres un asistente experto en análisis de datos.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 500,
        });

        const insights = openaiResponse.data.choices[0].message.content.trim();

        res.status(200).json({ insights });
    } catch (err) {
        res.status(500).json({ error: 'Error generando insights', details: err.message });
    }
};
