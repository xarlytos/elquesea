const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { body, validationResult } = require('express-validator');
const { sesClient } = require('../config/aws');
const Queue = require('bull');
const Redis = require('ioredis');

// Configuración de Redis
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

// Crear cola de emails
const emailQueue = new Queue('email-queue', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    }
});

// Configuración de límites
const DAILY_LIMIT = process.env.EMAIL_DAILY_LIMIT || 1000;
const BATCH_SIZE = process.env.EMAIL_BATCH_SIZE || 50;

// Validaciones para el endpoint
const emailValidations = [
    body('sender').isEmail().withMessage('Sender debe ser un email válido'),
    body('recipient').isEmail().withMessage('Recipient debe ser un email válido'),
    body('subject').notEmpty().withMessage('Subject es requerido'),
    body('htmlBody').optional(),
    body('textBody').optional(),
    body().custom((value) => {
        if (!value.htmlBody && !value.textBody) {
            throw new Error('Se requiere al menos htmlBody o textBody');
        }
        return true;
    })
];

// Procesador de la cola de emails
emailQueue.process(async (job) => {
    const { destinatario, asunto, contenidoHtml, contenidoTexto, remitente } = job.data;
    
    try {
        const params = {
            Source: remitente,
            Destination: {
                ToAddresses: [destinatario],
            },
            Message: {
                Subject: {
                    Data: asunto,
                    Charset: 'UTF-8',
                },
                Body: {
                    ...(contenidoHtml && {
                        Html: {
                            Data: contenidoHtml,
                            Charset: 'UTF-8',
                        },
                    }),
                    ...(contenidoTexto && {
                        Text: {
                            Data: contenidoTexto,
                            Charset: 'UTF-8',
                        },
                    }),
                },
            },
        };

        const command = new SendEmailCommand(params);
        await sesClient.send(command);
        return { status: 'success', email: destinatario };
    } catch (error) {
        console.error(`Error enviando email a ${destinatario}:`, error);
        throw error;
    }
});

// Controlador para enviar emails
const sendEmail = async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { sender, recipient, subject, htmlBody, textBody } = req.body;

        // Agregar trabajo a la cola
        const job = await emailQueue.add({
            destinatario: recipient,
            asunto: subject,
            contenidoHtml: htmlBody,
            contenidoTexto: textBody,
            remitente: sender
        });

        res.status(200).json({
            success: true,
            message: 'Email agregado a la cola',
            jobId: job.id
        });

    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al enviar el email'
        });
    }
};

// Validaciones para campañas de email
const campaignValidations = [
    body('nombre').notEmpty().withMessage('El nombre de la campaña es requerido'),
    body('asunto').notEmpty().withMessage('El asunto es requerido'),
    body('contenidoHtml').optional(),
    body('contenidoTexto').optional(),
    body('destinatarios').isArray().withMessage('Los destinatarios deben ser un array'),
    body('destinatarios.*').isEmail().withMessage('Todos los destinatarios deben ser emails válidos'),
    body('programacion').optional().isISO8601().withMessage('La fecha de programación debe ser válida'),
    body().custom((value) => {
        if (!value.contenidoHtml && !value.contenidoTexto) {
            throw new Error('Se requiere al menos contenidoHtml o contenidoTexto');
        }
        return true;
    })
];

// Controlador para crear una campaña de email
const createCampaign = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, asunto, contenidoHtml, contenidoTexto, destinatarios, programacion } = req.body;
        const trainer = req.user;

        // Verificar límite diario
        const redis = new Redis(redisConfig);
        const fecha = new Date().toISOString().split('T')[0];
        const enviosHoy = await redis.get(`email_count:${trainer.email}:${fecha}`) || 0;

        if (parseInt(enviosHoy) + destinatarios.length > DAILY_LIMIT) {
            return res.status(400).json({
                success: false,
                error: `Has excedido el límite diario de ${DAILY_LIMIT} emails`
            });
        }

        // Dividir destinatarios en lotes
        const lotes = [];
        for (let i = 0; i < destinatarios.length; i += BATCH_SIZE) {
            lotes.push(destinatarios.slice(i, i + BATCH_SIZE));
        }

        // Crear trabajos en la cola para cada lote
        const jobs = [];
        for (const lote of lotes) {
            const jobPromises = lote.map(destinatario => {
                return emailQueue.add({
                    destinatario,
                    asunto,
                    contenidoHtml,
                    contenidoTexto,
                    remitente: trainer.email
                }, {
                    delay: programacion ? new Date(programacion).getTime() - Date.now() : 0,
                    jobId: `${nombre}-${Date.now()}-${destinatario}`
                });
            });
            jobs.push(...await Promise.all(jobPromises));
        }

        // Actualizar contador diario
        await redis.incrby(`email_count:${trainer.email}:${fecha}`, destinatarios.length);
        await redis.expire(`email_count:${trainer.email}:${fecha}`, 86400);

        res.status(200).json({
            success: true,
            message: 'Campaña de email programada',
            jobIds: jobs.map(job => job.id),
            totalEmails: destinatarios.length,
            lotes: lotes.length
        });

    } catch (error) {
        console.error('Error al procesar la campaña de email:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al procesar la campaña de email'
        });
    }
};

// Controlador para verificar el estado de una campaña
const checkCampaignStatus = async (req, res) => {
    try {
        const { jobIds } = req.body;
        const estados = await Promise.all(
            jobIds.map(async (jobId) => {
                const job = await emailQueue.getJob(jobId);
                if (!job) return { jobId, status: 'no encontrado' };
                
                const state = await job.getState();
                const progress = job.progress();
                return {
                    jobId,
                    status: state,
                    progress,
                    failCount: job.attemptsMade,
                    ...(job.failedReason && { error: job.failedReason })
                };
            })
        );

        res.status(200).json({
            success: true,
            estados
        });

    } catch (error) {
        console.error('Error al verificar estado de la campaña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al verificar estado de la campaña'
        });
    }
};

const { welcomeEmailTemplate, birthdayEmailTemplate } = require('../templates/emailTemplates');
const Client = require('../models/Client');

// Controlador para enviar email de bienvenida
const sendWelcomeEmail = async (req, res) => {
    try {
        const { clientId } = req.body;
        const trainer = req.user;

        // Buscar el cliente en la base de datos
        const client = await Client.findById(clientId).populate('trainer');
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente no encontrado'
            });
        }

        // Verificar que el cliente pertenece al entrenador
        if (client.trainer._id.toString() !== trainer._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para enviar emails a este cliente'
            });
        }

        // Obtener la plantilla de email
        const template = welcomeEmailTemplate(client.nombre, trainer.nombre);

        // Crear el trabajo en la cola
        const job = await emailQueue.add({
            destinatario: client.email,
            asunto: template.subject,
            contenidoHtml: template.htmlBody,
            contenidoTexto: template.textBody,
            remitente: trainer.email
        }, {
            jobId: `welcome-${client._id}-${Date.now()}`
        });

        res.status(200).json({
            success: true,
            message: 'Email de bienvenida programado',
            jobId: job.id
        });

    } catch (error) {
        console.error('Error al enviar email de bienvenida:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al enviar el email de bienvenida'
        });
    }
};

// Controlador para activar/desactivar felicitación de cumpleaños
const toggleBirthdayEmail = async (req, res) => {
    try {
        const { clientId, enable } = req.body;
        const trainer = req.user;

        // Buscar el cliente
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente no encontrado'
            });
        }

        // Verificar que el cliente pertenece al entrenador
        if (client.trainer.toString() !== trainer._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para modificar este cliente'
            });
        }

        // Actualizar la preferencia de felicitación
        client.enviarFelicitacionCumple = enable;
        await client.save();

        res.status(200).json({
            success: true,
            message: `Felicitación de cumpleaños ${enable ? 'activada' : 'desactivada'} para el cliente`
        });

    } catch (error) {
        console.error('Error al actualizar preferencia de cumpleaños:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al actualizar la preferencia'
        });
    }
};

// Función para enviar felicitaciones de cumpleaños
const sendBirthdayEmails = async () => {
    try {
        const today = new Date();
        
        // Buscar clientes que cumplen años hoy y tienen activada la felicitación
        const clients = await Client.find({
            enviarFelicitacionCumple: true,
            fechaNacimiento: {
                $exists: true,
                $ne: null
            }
        }).populate('trainer');

        for (const client of clients) {
            const birthDate = new Date(client.fechaNacimiento);
            
            // Comparar mes y día
            if (birthDate.getMonth() === today.getMonth() && 
                birthDate.getDate() === today.getDate()) {
                
                const template = birthdayEmailTemplate(client.nombre, client.trainer.nombre);

                // Añadir a la cola de emails
                await emailQueue.add({
                    destinatario: client.email,
                    asunto: template.subject,
                    contenidoHtml: template.htmlBody,
                    contenidoTexto: template.textBody,
                    remitente: client.trainer.email
                }, {
                    jobId: `birthday-${client._id}-${Date.now()}`
                });
            }
        }
    } catch (error) {
        console.error('Error al enviar emails de cumpleaños:', error);
    }
};

// Programar el envío diario de felicitaciones
const birthdayCheckSchedule = new Queue('birthday-check', {
    redis: redisConfig,
    defaultJobOptions: {
        repeat: {
            cron: '0 9 * * *' // Ejecutar todos los días a las 9:00 AM
        }
    }
});

birthdayCheckSchedule.process(async () => {
    await sendBirthdayEmails();
});

module.exports = {
    emailValidations,
    sendEmail,
    campaignValidations,
    createCampaign,
    checkCampaignStatus,
    sendWelcomeEmail,
    toggleBirthdayEmail
};
