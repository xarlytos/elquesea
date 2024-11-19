// controllers/paymentPlanController.js

const PaymentPlan = require('../models/PaymentPlan');

// Detecta si el entorno es de prueba o desarrollo sin Stripe
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
let stripe = null;

// Función para inicializar Stripe solo cuando es necesario
function getStripeInstance() {
  if (!stripe && !isTestEnv) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Crear un plan de pago (simulado si no se usa Stripe)
exports.crearPlanDePago = async (req, res) => {
  try {
    const { precio, moneda, frecuencia, detalles } = req.body;

    // Simulación de creación en Stripe
    let stripeProductId, stripePriceId;
    if (isTestEnv) {
      // Simula IDs de producto y precio de Stripe
      stripeProductId = 'prod_mockProductId';
      stripePriceId = 'price_mockPriceId';
    } else {
      // Llamada real a Stripe en producción
      const stripeInstance = getStripeInstance();
      const product = await stripeInstance.products.create({
        name: `Plan de ${frecuencia}`,
        description: detalles,
      });
      const price = await stripeInstance.prices.create({
        unit_amount: precio * 100, // Stripe usa centavos
        currency: moneda,
        recurring: { interval: frecuencia.toLowerCase() },
        product: product.id,
      });
      stripeProductId = product.id;
      stripePriceId = price.id;
    }

    // Crear el plan de pago en la base de datos
    const paymentPlan = new PaymentPlan({
      precio,
      moneda,
      frecuencia,
      detalles,
      stripeProductId,
      stripePriceId,
    });

    await paymentPlan.save();
    res.status(201).json(paymentPlan);

  } catch (error) {
    res.status(500).json({ message: 'Error al crear el plan de pago', error });
  }
};

// Obtener todos los planes de pago
exports.obtenerPlanesDePago = async (req, res) => {
  try {
    const planesDePago = await PaymentPlan.find().populate('servicio');
    res.status(200).json(planesDePago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los planes de pago' });
  }
};

// Obtener un plan de pago por ID
exports.obtenerPlanDePagoPorId = async (req, res) => {
  try {
    const planDePago = await PaymentPlan.findById(req.params.id).populate('servicio');
    if (!planDePago) return res.status(404).json({ message: 'Plan de pago no encontrado' });
    res.status(200).json(planDePago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el plan de pago' });
  }
};

// Actualizar un plan de pago
exports.actualizarPlanDePago = async (req, res) => {
  try {
    const updatedPlan = await PaymentPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPlan) return res.status(404).json({ message: 'Plan de pago no encontrado' });
    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el plan de pago' });
  }
};

// Eliminar un plan de pago
exports.eliminarPlanDePago = async (req, res) => {
  try {
    const planDePago = await PaymentPlan.findById(req.params.id);
    if (!planDePago) return res.status(404).json({ message: 'Plan de pago no encontrado' });

    if (!isTestEnv) {
      // Solo intenta eliminar en Stripe si no estamos en entorno de prueba
      const stripeInstance = getStripeInstance();
      await stripeInstance.products.del(planDePago.stripeProductId);
    }

    await planDePago.remove();
    res.status(200).json({ message: 'Plan de pago eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el plan de pago', error });
  }
};
