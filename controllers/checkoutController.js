// controllers/checkoutController.js

const PaymentPlan = require('../models/PaymentPlan');
const stripeService = require('./services/stripeService');

// Condición para desactivar Stripe en modo de prueba
const isTestEnv = process.env.NODE_ENV === 'test';

// Crear una sesión de checkout en Stripe (o simulado en entorno de prueba)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { planDePagoId } = req.body;
    const clientId = req.user.id;

    const paymentPlan = await PaymentPlan.findById(planDePagoId);
    if (!paymentPlan) {
      return res.status(404).json({ message: 'Plan de pago no encontrado' });
    }

    // Simulación en modo de prueba
    if (isTestEnv) {
      return res.json({ url: 'https://checkout.stripe.com/mock-session-url' });
    }

    // Llamada real a Stripe en entornos de producción o desarrollo
    const session = await stripeService.createCheckoutSession({
      payment_method_types: ['card'],
      line_items: [{
        price: paymentPlan.stripePriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: req.user.email,
      metadata: {
        clientId: clientId,
        planDePagoId: paymentPlan._id.toString()
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la sesión de checkout', error });
  }
};
