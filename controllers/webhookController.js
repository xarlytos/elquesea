// controllers/webhookController.js

const Transaction = require('../models/Transaction');
const Income = require('../models/Income');
const PaymentPlan = require('../models/PaymentPlan');
const Trainer = require('../models/Trainer');
const stripeService = require('./services/stripeService');

// Procesa los webhooks de Stripe (o simulado en entorno de prueba)
exports.handleStripeWebhook = async (req, res) => {
  if (process.env.NODE_ENV === 'test') {
    // Simulación de evento en modo de prueba
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            clientId: 'mockClientId',
            planDePagoId: 'mockPlanDePagoId'
          },
          amount_total: 1000,
          currency: 'usd',
          payment_intent: 'mockPaymentIntent',
          subscription: 'mockSubscriptionId'
        }
      }
    };

    await handleEvent(mockEvent);
    return res.json({ received: true, message: 'Mock event processed' });
  }

  // Lógica real de Stripe en otros entornos
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = await stripeService.constructEvent(req.body, signature);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await handleEvent(event);
  res.json({ received: true });
};

// Maneja los eventos de Stripe o los eventos simulados en pruebas
async function handleEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session) {
  const { clientId, planDePagoId } = session.metadata;
  const planDePago = await PaymentPlan.findById(planDePagoId);

  if (planDePago) {
    const transaction = new Transaction({
      cliente: clientId,
      planDePago: planDePagoId,
      monto: session.amount_total / 100,
      moneda: session.currency,
      fecha: new Date(),
      estado: 'Completada',
      stripePaymentIntentId: session.payment_intent,
      stripeSubscriptionId: session.subscription
    });

    await transaction.save();
  }
}

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  const transaction = await Transaction.findOne({ stripeSubscriptionId: subscriptionId });

  if (transaction) {
    const trainer = await Trainer.findById(transaction.planDePago.entrenador);

    if (trainer) {
      const income = new Income({
        entrenador: trainer._id,
        monto: invoice.amount_paid / 100,
        moneda: invoice.currency,
        fecha: new Date(),
        descripcion: 'Ingreso por suscripción',
        transaccion: transaction._id
      });

      await income.save();
      trainer.ingresosTotales += income.monto;
      await trainer.save();
    }
  }
}
