// routes/paymentPlanRoutes.js

const express = require('express');
const router = express.Router();
const {
  createPaymentPlan,
  getAllPaymentPlans,
  getPaymentPlanById,
  updatePaymentPlan,
  deletePaymentPlan,
  associateClientToPaymentPlan,
  getClientsByPaymentPlan,
  disassociateClientFromPaymentPlan
} = require('../controllers/paymentPlanController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const stripeService = require('../controllers/services/stripeService');
const PaymentPlan = require('../models/PaymentPlan');
const Client = require('../models/Client');
const Service = require('../models/Service');

// Crear un nuevo plan de pago (solo para entrenadores)
router.post('/', verificarToken, verificarRol('trainer'), createPaymentPlan);

// Obtener todos los planes de pago
router.get('/', verificarToken, getAllPaymentPlans);

// Obtener un plan de pago específico por ID
router.get('/:paymentPlanId', verificarToken, getPaymentPlanById);

// Actualizar un plan de pago
router.put('/:paymentPlanId', verificarToken, verificarRol('trainer'), updatePaymentPlan);

// Eliminar un plan de pago
router.delete('/:paymentPlanId', verificarToken, verificarRol('trainer'), deletePaymentPlan);

// Asociar un cliente a un plan de pago
router.post('/:paymentPlanId/clients', verificarToken, verificarRol('trainer'), associateClientToPaymentPlan);

// Obtener clientes de un plan de pago
router.get('/:paymentPlanId/clients', verificarToken, getClientsByPaymentPlan);

// Desasociar un cliente de un plan de pago
router.delete('/:paymentPlanId/clients', verificarToken, verificarRol('trainer'), disassociateClientFromPaymentPlan);

// Generar enlace de pago para un plan
router.post('/:planId/payment-link', verificarToken, verificarRol('trainer'), async (req, res) => {
    try {
        const { planId } = req.params;
        const { clientId } = req.body;
        
        // Obtener el plan
        const plan = await PaymentPlan.findById(planId).populate('servicio');
        if (!plan) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }

        // Verificar que el entrenador es el dueño del servicio asociado al plan
        if (!plan.servicio || plan.servicio.entrenador.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para generar enlaces para este plan' });
        }

        // Verificar que el cliente existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/payment/success`;
        const cancelUrl = `${baseUrl}/payment/cancel`;

        const paymentLink = await stripeService.createPaymentLink(
            plan,
            clientId,
            successUrl,
            cancelUrl
        );

        res.json(paymentLink);
    } catch (error) {
        console.error('Error al generar enlace de pago:', error);
        res.status(500).json({
            error: 'Error al generar enlace de pago',
            details: error.message
        });
    }
});

// Webhook para manejar eventos de Stripe
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = await stripeService.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Error en webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        try {
            const result = await stripeService.handleCheckoutComplete(event.data.object.id);
            
            if (result.success) {
                // Asociar el cliente al plan
                await PaymentPlan.findByIdAndUpdate(result.planId, {
                    $addToSet: { clientes: result.clientId }
                });

                // Actualizar el cliente con la información de Stripe
                await Client.findByIdAndUpdate(result.clientId, {
                    stripeCustomerId: result.customerId,
                    $addToSet: { subscriptions: result.subscriptionId }
                });
            }
        } catch (error) {
            console.error('Error procesando checkout completado:', error);
            return res.status(500).json({ error: 'Error procesando pago' });
        }
    }

    res.json({ received: true });
});

module.exports = router;
