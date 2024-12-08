// routes/webhookRoutes.js

const express = require('express');
const router = express.Router();
const stripeService = require('../controllers/services/stripeService');

// Esta ruta no necesita el middleware de autenticación
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        
        await stripeService.handleWebhookEvent(event);
        
        res.json({ received: true });
    } catch (err) {
        console.error('Error al procesar webhook:', err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

module.exports = router;
