const { body, validationResult } = require('express-validator');
const TipsCampaign = require('../models/TipsCampaign');
const Queue = require('bull');
const { tipEmailTemplate } = require('../templates/emailTemplates');
const { redisConfig } = require('../config/redis');

// Cola para el envío de consejos
const tipsQueue = new Queue('tips-emails', redisConfig);

// Validaciones para la creación de campaña
const campaignValidations = [
    body('nombre').notEmpty().withMessage('El nombre de la campaña es obligatorio'),
    body('consejos').isArray({ min: 1 }).withMessage('Debe incluir al menos un consejo'),
    body('consejos.*.contenido').notEmpty().withMessage('El contenido del consejo es obligatorio'),
    body('clientes').isArray({ min: 1 }).withMessage('Debe incluir al menos un cliente'),
    body('fechaInicio').isISO8601().withMessage('La fecha de inicio debe ser válida'),
    body('frecuencia').isIn(['diaria', 'semanal']).withMessage('La frecuencia debe ser diaria o semanal'),
    body('horaEnvio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe estar en formato HH:mm')
];

// Crear nueva campaña de consejos
const createTipsCampaign = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            nombre,
            descripcion,
            consejos,
            clientes,
            fechaInicio,
            frecuencia,
            horaEnvio
        } = req.body;

        // Preparar los consejos con su orden
        const consejosOrdenados = consejos.map((consejo, index) => ({
            ...consejo,
            orden: index + 1
        }));

        const campaign = new TipsCampaign({
            nombre,
            descripcion,
            trainer: req.user._id,
            clientes,
            consejos: consejosOrdenados,
            fechaInicio,
            frecuencia,
            horaEnvio
        });

        await campaign.save();

        // Programar el primer envío
        await scheduleTipsSending(campaign._id);

        res.status(201).json({
            success: true,
            message: 'Campaña de consejos creada exitosamente',
            campaign
        });

    } catch (error) {
        console.error('Error al crear campaña de consejos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al crear la campaña'
        });
    }
};

// Función para programar el envío de consejos
const scheduleTipsSending = async (campaignId) => {
    try {
        const campaign = await TipsCampaign.findById(campaignId)
            .populate('trainer')
            .populate('clientes');

        if (!campaign || campaign.estado !== 'activa') return;

        const [hours, minutes] = campaign.horaEnvio.split(':');
        const cronPattern = campaign.frecuencia === 'diaria' 
            ? `${minutes} ${hours} * * *`
            : `${minutes} ${hours} * * 1`; // Los lunes si es semanal

        await tipsQueue.add(
            'send-tips',
            { campaignId: campaign._id },
            {
                repeat: { cron: cronPattern },
                jobId: `tips-${campaign._id}`
            }
        );

    } catch (error) {
        console.error('Error al programar envío de consejos:', error);
    }
};

// Procesar el envío de consejos
tipsQueue.process('send-tips', async (job) => {
    try {
        const { campaignId } = job.data;
        const campaign = await TipsCampaign.findById(campaignId)
            .populate('trainer')
            .populate('clientes');

        if (!campaign || campaign.estado !== 'activa') {
            return;
        }

        // Encontrar el próximo consejo no enviado
        const proximoConsejo = campaign.consejos.find(c => !c.enviado);
        if (!proximoConsejo) {
            campaign.estado = 'completada';
            await campaign.save();
            return;
        }

        // Enviar el consejo a cada cliente
        for (const cliente of campaign.clientes) {
            const template = tipEmailTemplate(
                cliente.nombre,
                campaign.trainer.nombre,
                proximoConsejo.contenido,
                campaign.nombre
            );

            // Usar la cola de emails existente
            await emailQueue.add({
                destinatario: cliente.email,
                asunto: template.subject,
                contenidoHtml: template.htmlBody,
                contenidoTexto: template.textBody,
                remitente: campaign.trainer.email
            });
        }

        // Marcar el consejo como enviado
        proximoConsejo.enviado = true;
        proximoConsejo.fechaEnvio = new Date();
        campaign.ultimoEnvio = new Date();
        await campaign.save();

    } catch (error) {
        console.error('Error al procesar envío de consejos:', error);
        throw error;
    }
});

// Pausar campaña
const pauseCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await TipsCampaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Campaña no encontrada'
            });
        }

        if (campaign.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar esta campaña'
            });
        }

        campaign.estado = 'pausada';
        await campaign.save();

        // Eliminar el trabajo programado
        await tipsQueue.removeRepeatable('send-tips', {
            jobId: `tips-${campaign._id}`
        });

        res.status(200).json({
            success: true,
            message: 'Campaña pausada exitosamente'
        });

    } catch (error) {
        console.error('Error al pausar campaña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al pausar la campaña'
        });
    }
};

// Reanudar campaña
const resumeCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await TipsCampaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Campaña no encontrada'
            });
        }

        if (campaign.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar esta campaña'
            });
        }

        campaign.estado = 'activa';
        await campaign.save();

        // Reprogramar el envío
        await scheduleTipsSending(campaign._id);

        res.status(200).json({
            success: true,
            message: 'Campaña reanudada exitosamente'
        });

    } catch (error) {
        console.error('Error al reanudar campaña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al reanudar la campaña'
        });
    }
};

module.exports = {
    campaignValidations,
    createTipsCampaign,
    pauseCampaign,
    resumeCampaign
};
