// controllers/paymentPlanController.js
const PaymentPlan = require('../models/PaymentPlan');
const { Service } = require('../models/Service');
const Client = require('../models/Client');
const stripeService = require('./services/stripeService');

/**
 * Crea un nuevo producto en Stripe
 */
async function createStripeProduct(name, description) {
  return await stripeService.createProduct(name, description);
}

/**
 * Crea un precio en Stripe
 * @param {string} productId - El ID del producto en Stripe
 * @param {number} amount - Monto en centavos (ej: €10 => 1000)
 * @param {string} currency - Moneda (ej: 'eur')
 * @param {string} interval - 'month', 'year', 'quarter' (opcional)
 */
async function createStripePrice(productId, amount, currency, interval) {
  return await stripeService.createPrice(productId, amount, currency, interval);
}

/**
 * Crea una suscripción en Stripe dado un cliente (en Stripe) y un precio
 */
async function createStripeSubscription(customerId, priceId, metadata = {}) {
  return await stripeService.createSubscription(customerId, priceId, metadata);
}

/**
 * Crear un nuevo plan de pago
 */
const createPaymentPlan = async (req, res) => {
  try {
    console.log('=== Iniciando creación de plan de pago ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    const {
      nombre,
      precio,
      moneda = 'EUR',
      frecuencia,
      duracion,
      detalles,
      servicio: servicioId,
      crearEnStripe = false
    } = req.body;

    // Validar campos obligatorios
    if (!nombre || !precio || !frecuencia || !duracion) {
      console.log('Error: Faltan campos obligatorios');
      return res.status(400).json({
        mensaje: 'Faltan campos obligatorios',
        camposRequeridos: {
          nombre: !nombre,
          precio: !precio,
          frecuencia: !frecuencia,
          duracion: !duracion
        }
      });
    }

    // Validar que el servicio no esté vacío
    if (!servicioId) {
      console.log('Error: ID de servicio no proporcionado');
      return res.status(400).json({
        mensaje: 'Debe proporcionar un ID de servicio válido'
      });
    }

    // Validar frecuencia
    const frecuenciasValidas = ['Único', 'Mensual', 'Trimestral', 'Anual'];
    if (!frecuenciasValidas.includes(frecuencia)) {
      console.log('Error: Frecuencia inválida:', frecuencia);
      return res.status(400).json({
        mensaje: 'Frecuencia inválida',
        frecuenciasPermitidas: frecuenciasValidas
      });
    }

    // Validar duración
    if (frecuencia === 'Único' && duracion !== 1) {
      console.log('Error: Duración inválida para pago único');
      return res.status(400).json({
        mensaje: 'Para pagos únicos, la duración debe ser 1'
      });
    }

    // Validar precio
    if (precio <= 0) {
      console.log('Error: Precio inválido:', precio);
      return res.status(400).json({
        mensaje: 'El precio debe ser mayor que 0'
      });
    }

    console.log('Datos procesados:');
    console.log('- Nombre:', nombre);
    console.log('- Precio:', precio);
    console.log('- Moneda:', moneda);
    console.log('- Frecuencia:', frecuencia);
    console.log('- Duración:', duracion);
    console.log('- Servicio ID:', servicioId);
    console.log('- Crear en Stripe:', crearEnStripe);

    // Verificar que el servicio exista y pertenece al entrenador
    const servicio = await Service.findById(servicioId);
    if (!servicio) {
      console.log('Error: Servicio no encontrado');
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    console.log('Servicio encontrado:', servicio.nombre);

    // Verificar que el usuario sea el entrenador del servicio
    if (servicio.entrenador.toString() !== req.user.id) {
      console.log('Error: Usuario no autorizado');
      return res.status(403).json({
        mensaje: 'No tienes permiso para crear planes de pago para este servicio'
      });
    }

    let stripeProductId = null;
    let stripePriceId = null;

    // Crear producto y precio en Stripe si se solicita
    if (crearEnStripe) {
      console.log('Creando producto en Stripe...');
      try {
        const product = await createStripeProduct(nombre, detalles);
        stripeProductId = product.id;
        console.log('Producto Stripe creado:', stripeProductId);

        // Convertir precio a centavos para Stripe
        const precioEnCentavos = Math.round(precio * 100);
        
        // Determinar el intervalo para Stripe
        let interval = null;
        if (frecuencia === 'Mensual') interval = 'month';
        else if (frecuencia === 'Trimestral') interval = 'quarter';
        else if (frecuencia === 'Anual') interval = 'year';

        if (interval) {
          console.log('Creando precio recurrente en Stripe...');
          console.log('- Intervalo:', interval);
          console.log('- Precio en centavos:', precioEnCentavos);
          
          const price = await createStripePrice(stripeProductId, precioEnCentavos, moneda.toLowerCase(), interval);
          stripePriceId = price.id;
          console.log('Precio Stripe creado:', stripePriceId);
        } else {
          console.log('Creando precio único en Stripe...');
          const price = await createStripePrice(stripeProductId, precioEnCentavos, moneda.toLowerCase());
          stripePriceId = price.id;
          console.log('Precio Stripe creado:', stripePriceId);
        }
      } catch (error) {
        console.error('Error al crear en Stripe:', error);
        return res.status(500).json({
          mensaje: 'Error al crear el producto en Stripe',
          error: error.message
        });
      }
    }

    // Crear el plan de pago
    const planDePago = new PaymentPlan({
      nombre,
      precio,
      moneda,
      frecuencia,
      duracion,
      detalles,
      servicio: servicioId,
      entrenador: req.user.id,
      stripeProductId,
      stripePriceId
    });

    console.log('Guardando plan de pago en la base de datos...');
    await planDePago.save();
    console.log('Plan de pago guardado con ID:', planDePago._id);

    // Actualizar el servicio con el ID del plan de pago
    console.log('Actualizando servicio con el plan de pago...');
    await Service.findByIdAndUpdate(
      servicioId,
      { $push: { planesDePago: planDePago._id } },
      { new: true }
    );
    console.log('Servicio actualizado correctamente');

    res.status(201).json({
      mensaje: 'Plan de pago creado exitosamente y servicio actualizado',
      planDePago
    });
  } catch (error) {
    console.error('Error al crear el plan de pago:', error);
    res.status(500).json({
      mensaje: 'Error al crear el plan de pago',
      error: error.message
    });
  }
};

/**
 * Obtener todos los planes de pago
 */
const getAllPaymentPlans = async (req, res) => {
  try {
    const paymentPlans = await PaymentPlan.find().populate('servicio').populate('clientes');
    res.status(200).json(paymentPlans);
  } catch (error) {
    console.error('Error al obtener los planes de pago:', error);
    res.status(500).json({ mensaje: 'Error al obtener los planes de pago.', error: error.message });
  }
};

/**
 * Obtener un plan de pago por ID
 */
const getPaymentPlanById = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('servicio').populate('clientes');
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }
    res.status(200).json(paymentPlan);
  } catch (error) {
    console.error('Error al obtener el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al obtener el plan de pago.', error: error.message });
  }
};

/**
 * Actualizar un plan de pago
 */
const updatePaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    const updates = req.body;

    const paymentPlan = await PaymentPlan.findById(paymentPlanId);
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario del servicio asociado
    const service = await Service.findById(paymentPlan.servicio);
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este plan de pago.' });
    }

    Object.assign(paymentPlan, updates);
    const updatedPaymentPlan = await paymentPlan.save();

    res.status(200).json(updatedPaymentPlan);
  } catch (error) {
    console.error('Error al actualizar el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el plan de pago.', error: error.message });
  }
};

/**
 * Eliminar un plan de pago
 */
const deletePaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;

    const paymentPlan = await PaymentPlan.findById(paymentPlanId);
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario del servicio
    const service = await Service.findById(paymentPlan.servicio);
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este plan de pago.' });
    }

    await paymentPlan.remove();

    // Eliminar referencia del servicio
    service.planDePago = service.planDePago.filter(id => id.toString() !== paymentPlanId);
    await service.save();

    res.status(200).json({ mensaje: 'Plan de pago eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plan de pago.', error: error.message });
  }
};

/**
 * Asociar un cliente a un plan de pago y crear una suscripción en Stripe
 */
const associateClientToPaymentPlan = async (req, res) => {
  try {
    const { planId, clientId } = req.params;
    const { crearSuscripcionStripe = false } = req.body;

    // Verificar que el plan y el cliente existan
    const plan = await PaymentPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    // Verificar que el cliente no esté ya asociado al plan
    if (plan.clientes.includes(clientId)) {
      return res.status(400).json({ mensaje: 'El cliente ya está asociado a este plan.' });
    }

    // Si se requiere crear suscripción en Stripe
    if (crearSuscripcionStripe && plan.stripePriceId) {
      try {
        const subscription = await createStripeSubscription(
          client.stripeCustomerId,
          plan.stripePriceId,
          { planId, clientId }
        );
        // Aquí podrías guardar el ID de la suscripción si lo necesitas
      } catch (error) {
        console.error('Error al crear suscripción en Stripe:', error);
        return res.status(500).json({
          mensaje: 'Error al crear la suscripción en Stripe',
          error: error.message
        });
      }
    }

    // Asociar el cliente al plan
    plan.clientes.push(clientId);
    await plan.save();

    // Crear los ingresos futuros
    const incomeController = require('./incomeController');
    await incomeController.crearIngresosFuturos(plan, clientId);

    res.json({
      mensaje: 'Cliente asociado al plan exitosamente',
      plan
    });
  } catch (error) {
    console.error('Error al asociar cliente al plan:', error);
    res.status(500).json({
      mensaje: 'Error al asociar el cliente al plan',
      error: error.message
    });
  }
};

/**
 * Obtener clientes asociados a un plan de pago
 */
const getClientsByPaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('clientes');
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }
    res.status(200).json(paymentPlan.clientes);
  } catch (error) {
    console.error('Error al obtener los clientes del plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al obtener los clientes del plan de pago.', error: error.message });
  }
};

/**
 * Desasociar un cliente de un plan de pago
 */
const disassociateClientFromPaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    const { clientId } = req.body;

    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('servicio');
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    // Verificar permiso
    if (paymentPlan.servicio.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para desasociar clientes de este plan de pago.' });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    // Remover cliente del plan
    paymentPlan.clientes = paymentPlan.clientes.filter(id => id.toString() !== clientId);
    await paymentPlan.save();

    // Remover el servicio del cliente
    client.servicios = client.servicios.filter(id => id.toString() !== paymentPlan.servicio._id.toString());
    await client.save();

    // Remover al cliente del servicio
    paymentPlan.servicio.clientes = paymentPlan.servicio.clientes.filter(id => id.toString() !== clientId);
    await paymentPlan.servicio.save();

    res.status(200).json({ mensaje: 'Cliente desasociado del plan de pago exitosamente.' });
  } catch (error) {
    console.error('Error al desasociar el cliente del plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al desasociar el cliente del plan de pago.', error: error.message });
  }
};

module.exports = {
  createPaymentPlan,
  getAllPaymentPlans,
  getPaymentPlanById,
  updatePaymentPlan,
  deletePaymentPlan,
  associateClientToPaymentPlan,
  getClientsByPaymentPlan,
  disassociateClientFromPaymentPlan
};
