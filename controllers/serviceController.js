// controllers/serviceController.js
const { Service } = require('../models/Service');
const Client = require('../models/Client');
const Planning = require('../models/Planning');
const Dieta = require('../models/Dieta');
const Income = require('../models/Income');
const jwt = require('jsonwebtoken');
const PaymentPlan = require('../models/PaymentPlan');

/**
 * Crear un nuevo servicio
 */
const createService = async (req, res) => {
  try {
    console.log('🚀 Iniciando la creación de un nuevo servicio...');
    const {
      nombre,
      descripcion,
      tipo,
      serviciosAdicionales, // Array de opciones seleccionadas
    } = req.body;

    console.log('📥 Datos recibidos para el servicio:', {
      nombre,
      descripcion,
      tipo,
      serviciosAdicionales,
    });

    // Obtener el ID del entrenador desde el token (req.user)
    const entrenadorId = req.user.id;
    console.log('👤 ID del entrenador obtenido:', entrenadorId);

    // Crear el servicio
    const newService = new Service({
      nombre,
      descripcion,
      tipo,
      entrenador: entrenadorId,
      serviciosAdicionales,
      fechaCreacion: new Date(),
    });

    const savedService = await newService.save();
    console.log('✅ Servicio creado y guardado en la base de datos:', savedService);

    res.status(201).json(savedService);
  } catch (error) {
    console.error('❌ Error al crear el servicio:', error);
    res.status(500).json({ mensaje: 'Error al crear el servicio.', error: error.message });
  }
};

/**
 * Obtener todos los servicios
 */
const getAllServices = async (req, res) => {
  try {
    console.log('📋 Obteniendo todos los servicios...');
    const services = await Service.find().populate('entrenador').populate('planesDePago').populate('clientes');
    res.status(200).json(services);
  } catch (error) {
    console.error('❌ Error al obtener los servicios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los servicios.', error: error.message });
  }
};

/**
 * Obtener un servicio por ID
 */
const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    console.log('🔍 Obteniendo servicio con ID:', serviceId);
    const service = await Service.findById(serviceId).populate('entrenador').populate('planesDePago').populate('clientes');
    if (!service) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }
    res.status(200).json(service);
  } catch (error) {
    console.error('❌ Error al obtener el servicio:', error);
    res.status(500).json({ mensaje: 'Error al obtener el servicio.', error: error.message });
  }
};

/**
 * Actualizar un servicio
 */
const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;
    console.log('🛠️ Actualizando servicio con ID:', serviceId, 'con datos:', updates);

    // Verificar que el servicio exista
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este servicio.' });
    }

    // Actualizar el servicio
    Object.assign(service, updates);
    const updatedService = await service.save();

    res.status(200).json(updatedService);
  } catch (error) {
    console.error('❌ Error al actualizar el servicio:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el servicio.', error: error.message });
  }
};

/**
 * Eliminar un servicio
 */
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    console.log('🗑️ Eliminando servicio con ID:', serviceId);

    // Verificar que el servicio exista
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este servicio.' });
    }

    // Eliminar el servicio
    await service.remove();
    res.status(200).json({ mensaje: 'Servicio eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar el servicio:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el servicio.', error: error.message });
  }
};

/**
 * Crear un nuevo plan de pago asignado a un servicio
 */
const createPaymentPlan = async (req, res) => {
  try {
    console.log('💸 Iniciando la creación de un plan de pago...');
    const {
      nombre, // Campo nuevo
      precio,
      moneda,
      frecuencia,
      detalles,
      stripeProductId,
      stripePriceId,
      servicio,
    } = req.body;

    console.log('📥 Datos recibidos para el plan de pago:', {
      nombre,
      precio,
      moneda,
      frecuencia,
      detalles,
      stripeProductId,
      stripePriceId,
      servicio,
    });

    // Verificar que el servicio exista
    const servicioExistente = await Service.findById(servicio);
    if (!servicioExistente) {
      console.log('⚠️ Servicio no encontrado para el ID:', servicio);
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }

    console.log('🔗 Servicio encontrado:', servicioExistente);

    console.log('📝 Nombre recibido en el cuerpo de la solicitud:', nombre);

    // Crear el PaymentPlan
    const newPaymentPlan = new PaymentPlan({
      nombre, // Campo nuevo
      precio,
      moneda,
      frecuencia,
      detalles,
      stripeProductId,
      stripePriceId,
      servicio,
      fechaCreacion: new Date(),
    });

    const savedPaymentPlan = await newPaymentPlan.save();
    console.log('✅ Plan de pago creado:', savedPaymentPlan);

    // Asignar el PaymentPlan al Service correspondiente
    await Service.findByIdAndUpdate(
      servicio,
      { $push: { planesDePago: savedPaymentPlan._id } },
      { new: true }
    );
    console.log('🔄 Plan de pago asignado al servicio');

    // Devolver el plan de pago creado junto con el servicio actualizado
    const servicioActualizado = await Service.findById(servicio)
      .populate('planesDePago')
      .populate('entrenador')
      .populate('clientes');

    res.status(201).json({
      mensaje: 'Plan de pago creado y asignado al servicio exitosamente',
      planDePago: savedPaymentPlan,
      servicio: servicioActualizado
    });
  } catch (error) {
    console.error('❌ Error al crear el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al crear el plan de pago.', error: error.message });
  }
};

/**
 * Obtener todos los planes de pago
 */
const getAllPaymentPlans = async (req, res) => {
  try {
    console.log('📋 Obteniendo todos los planes de pago...');
    const paymentPlans = await PaymentPlan.find().populate('servicio').populate('clientes');
    res.status(200).json(paymentPlans);
  } catch (error) {
    console.error('❌ Error al obtener los planes de pago:', error);
    res.status(500).json({ mensaje: 'Error al obtener los planes de pago.', error: error.message });
  }
};

/**
 * Obtener un plan de pago por ID
 */
const getPaymentPlanById = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    console.log('🔍 Obteniendo plan de pago con ID:', paymentPlanId);
    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('servicio').populate('clientes');
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }
    res.status(200).json(paymentPlan);
  } catch (error) {
    console.error('❌ Error al obtener el plan de pago:', error);
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
    console.log('🛠️ Actualizando plan de pago con ID:', paymentPlanId, 'con datos:', updates);

    // Verificar que el plan de pago exista
    const paymentPlan = await PaymentPlan.findById(paymentPlanId);
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario del servicio
    const service = await Service.findById(paymentPlan.servicio);
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este plan de pago.' });
    }

    // Actualizar el plan de pago
    Object.assign(paymentPlan, updates);
    const updatedPaymentPlan = await paymentPlan.save();

    res.status(200).json(updatedPaymentPlan);
  } catch (error) {
    console.error('❌ Error al actualizar el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el plan de pago.', error: error.message });
  }
};

/**
 * Eliminar un plan de pago
 */
const deletePaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    console.log('🗑️ Eliminando plan de pago con ID:', paymentPlanId);

    // Verificar que el plan de pago exista
    const paymentPlan = await PaymentPlan.findById(paymentPlanId);
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    // Verificar que el usuario sea el entrenador propietario del servicio
    const service = await Service.findById(paymentPlan.servicio);
    if (service.entrenador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este plan de pago.' });
    }

    // Eliminar el plan de pago
    await paymentPlan.remove();

    // Opcional: Eliminar referencia en el servicio
    service.planDePago = undefined;
    await service.save();

    res.status(200).json({ mensaje: 'Plan de pago eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar el plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plan de pago.', error: error.message });
  }
};

/**
 * Asociar un cliente a un plan de pago
 */
const associateClientToPaymentPlan = async (req, res) => {
  try {
    console.log('🤝 Iniciando asociación de cliente a plan de pago...');
    const { paymentPlanId } = req.params;
    const { clientId, metodoPago } = req.body;

    console.log('📥 Datos recibidos:', { paymentPlanId, clientId, metodoPago });

    // Verificar que el plan de pago exista
    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('servicio');
    if (!paymentPlan) {
      console.log('⚠️ Plan de pago no encontrado:', paymentPlanId);
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    console.log('🔗 Plan de pago encontrado:', paymentPlan);

    // Verificar que el cliente exista
    const client = await Client.findById(clientId);
    if (!client) {
      console.log('⚠️ Cliente no encontrado:', clientId);
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    console.log('👤 Cliente encontrado:', client);

    // Asegurar que los arrays existen
    paymentPlan.clientes = paymentPlan.clientes || [];
    client.servicios = client.servicios || [];
    paymentPlan.servicio.clientes = paymentPlan.servicio.clientes || [];

    // Asociar el cliente al plan de pago
    if (!paymentPlan.clientes.includes(client._id)) {
      paymentPlan.clientes.push(client._id);
      await paymentPlan.save();
    }

    // Asociar el servicio al cliente si no lo tiene ya
    if (!client.servicios.includes(paymentPlan.servicio._id)) {
      client.servicios.push(paymentPlan.servicio._id);
      await client.save();
    }

    // Asociar el cliente al servicio si no está ya asociado
    if (!paymentPlan.servicio.clientes.includes(client._id)) {
      paymentPlan.servicio.clientes.push(client._id);
      await paymentPlan.servicio.save();
    }

    // Crear servicios adicionales según corresponda
    const serviciosAdicionales = paymentPlan.servicio.serviciosAdicionales || [];
    console.log('🎁 Servicios adicionales:', serviciosAdicionales);

    const serviciosCreados = {
      planning: null,
      dieta: null,
      packCitas: null
    };

    // Crear planificación si está incluida y el cliente no tiene una activa
    if (serviciosAdicionales.includes('Planificacion') && !client.planningActivo) {
      console.log('📋 Creando planificación...');
      const planning = new Planning({
        nombre: `Plan de entrenamiento - ${client.nombre}`,
        descripcion: `Plan de entrenamiento para ${client.nombre}`,
        fechaInicio: new Date(),
        meta: 'Objetivo por definir',
        semanas: 4,
        cliente: client._id,
        trainer: paymentPlan.servicio.entrenador
      });
      await planning.save();
      serviciosCreados.planning = planning;

      // Agregar la planificación al servicio
      paymentPlan.servicio.planificaciones.push(planning._id);
    } else if (serviciosAdicionales.includes('Planificacion')) {
      console.log('📋 El cliente ya tiene un planning activo, omitiendo creación...');
      serviciosCreados.planning = client.planningActivo;
    }

    // Crear dieta si está incluida y el cliente no tiene una activa
    if (serviciosAdicionales.includes('Dietas') && !client.dietaActiva) {
      console.log('🥗 Creando dieta...');
      const dieta = await Dieta.create({
        nombre: `Plan nutricional - ${client.nombre}`,
        cliente: client._id,
        trainer: paymentPlan.servicio.entrenador,
        fechaInicio: new Date(),
        objetivo: 'Por definir',
        restricciones: 'Ninguna',
        estado: 'activa',
        fechaComienzo: new Date()
      });
      serviciosCreados.dieta = dieta;

      // Agregar la dieta al servicio
      paymentPlan.servicio.dietas.push(dieta._id);
    } else if (serviciosAdicionales.includes('Dietas')) {
      console.log('🥗 El cliente ya tiene una dieta activa, omitiendo creación...');
      serviciosCreados.dieta = client.dietaActiva;
    }

    // Crear servicio de pack de citas si está incluido
    if (serviciosAdicionales.includes('Pack de Citas')) {
      console.log('📅 Creando pack de citas...');
      const packCitas = await Service.create({
        nombre: `Pack de Citas - ${client.nombre}`,
        descripcion: 'Pack de citas incluido en el servicio',
        tipo: 'Pack de Citas',
        entrenador: paymentPlan.servicio.entrenador,
        clientes: [client._id]
      });
      serviciosCreados.packCitas = packCitas;

      // Agregar el pack de citas a los servicios del cliente
      client.servicios.push(packCitas._id);
      await client.save();
    }

    // Guardar los cambios en el servicio principal
    await paymentPlan.servicio.save();

    // Crear los ingresos según la frecuencia de pago
    console.log('💰 Creando ingresos programados...');
    const fechasIngresos = calcularFechasIngresos(paymentPlan.frecuencia);
    const ingresos = [];

    for (const fecha of fechasIngresos) {
      const ingreso = new Income({
        entrenador: paymentPlan.servicio.entrenador,
        cliente: client._id,
        planDePago: paymentPlan._id,
        monto: paymentPlan.precio,
        moneda: paymentPlan.moneda,
        metodoPago: metodoPago,
        estado: 'pendiente',
        fecha: fecha,
        descripcion: `Pago ${paymentPlan.frecuencia} - ${paymentPlan.servicio.nombre} - ${client.nombre}`
      });
      await ingreso.save();
      ingresos.push(ingreso);

      // Agregar el ingreso al servicio
      paymentPlan.servicio.ingresos.push(ingreso._id);
    }
    await paymentPlan.servicio.save();

    // Crear suscripción en Stripe si el método de pago es stripe
    let stripeSubscription = null;
    if (metodoPago === 'stripe' && paymentPlan.stripePriceId) {
      console.log('💳 Creando suscripción en Stripe...');
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Asumiendo que el cliente tiene un customerId en Stripe almacenado
        if (!client.stripeCustomerId) {
          return res.status(400).json({ 
            mensaje: 'El cliente no tiene un método de pago configurado en Stripe.' 
          });
        }

        stripeSubscription = await stripe.subscriptions.create({
          customer: client.stripeCustomerId,
          items: [{ price: paymentPlan.stripePriceId }],
          metadata: {
            clientId: client._id.toString(),
            paymentPlanId: paymentPlan._id.toString(),
            servicioId: paymentPlan.servicio._id.toString()
          }
        });
      } catch (stripeError) {
        console.error('❌ Error al crear suscripción en Stripe:', stripeError);
        // No detenemos el proceso si falla Stripe, solo registramos el error
      }
    }

    console.log('✅ Asociación completada exitosamente');
    res.status(200).json({
      mensaje: 'Cliente asociado exitosamente al plan de pago',
      serviciosCreados,
      ingresos,
      stripeSubscription
    });

  } catch (error) {
    console.error('❌ Error en la asociación:', error);
    res.status(500).json({ 
      mensaje: 'Error al asociar el cliente al plan de pago',
      error: error.message 
    });
  }
};

// Función auxiliar para calcular las fechas de los ingresos según la frecuencia
function calcularFechasIngresos(frecuencia) {
  const fechas = [];
  const hoy = new Date();

  switch (frecuencia) {
    case 'Único':
      fechas.push(hoy);
      break;
    case 'Mensual':
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy);
        fecha.setMonth(fecha.getMonth() + i);
        fechas.push(fecha);
      }
      break;
    case 'Trimestral':
      for (let i = 0; i < 4; i++) {
        const fecha = new Date(hoy);
        fecha.setMonth(fecha.getMonth() + (i * 3));
        fechas.push(fecha);
      }
      break;
    case 'Anual':
      fechas.push(hoy);
      break;
  }

  return fechas;
}

/**
 * Listar clientes asociados a un plan de pago
 */
const getClientsByPaymentPlan = async (req, res) => {
  try {
    const { paymentPlanId } = req.params;
    console.log('👥 Obteniendo clientes del plan de pago con ID:', paymentPlanId);

    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('clientes');
    if (!paymentPlan) {
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    res.status(200).json(paymentPlan.clientes);
  } catch (error) {
    console.error('❌ Error al obtener los clientes del plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al obtener los clientes del plan de pago.', error: error.message });
  }
};

/**
 * Desasociar un cliente de un plan de pago
 */
const disassociateClientFromPaymentPlan = async (req, res) => {
  try {
    console.log('🚪 Iniciando desasociación de cliente de plan de pago...');
    const { paymentPlanId } = req.params;
    const { clientId } = req.body;

    console.log('📥 Datos recibidos:', { paymentPlanId, clientId });

    // Verificar que el plan de pago exista
    const paymentPlan = await PaymentPlan.findById(paymentPlanId).populate('servicio');
    if (!paymentPlan) {
      console.log('⚠️ Plan de pago no encontrado:', paymentPlanId);
      return res.status(404).json({ mensaje: 'Plan de pago no encontrado.' });
    }

    console.log('🔗 Plan de pago encontrado:', paymentPlan);

    // Verificar que el cliente exista
    const client = await Client.findById(clientId);
    if (!client) {
      console.log('⚠️ Cliente no encontrado:', clientId);
      return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    }

    console.log('👤 Cliente encontrado:', client);

    // Desasociar el cliente del plan de pago
    paymentPlan.clientes = paymentPlan.clientes.filter(id => id.toString() !== client._id.toString());
    await paymentPlan.save();

    // Desasociar el servicio principal del cliente
    client.servicios = client.servicios.filter(id => id.toString() !== paymentPlan.servicio._id.toString());
    await client.save();

    // Remover al cliente del servicio principal
    paymentPlan.servicio.clientes = paymentPlan.servicio.clientes.filter(id => id.toString() !== client._id.toString());
    await paymentPlan.servicio.save();

    // Opcional: Eliminar servicios adicionales del cliente
    // Aquí podrías eliminar los servicios adicionales creados para el cliente

    res.status(200).json({ mensaje: 'Cliente desasociado del plan de pago exitosamente.' });
  } catch (error) {
    console.error('❌ Error al desasociar el cliente del plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al desasociar el cliente del plan de pago.', error: error.message });
  }
};

/**
 * Obtener servicios por tipo
 */
const getServicesByType = async (req, res) => {
  try {
    const { tipo } = req.params;
    console.log('🔍 Obteniendo servicios del tipo:', tipo);

    // Verificar que el tipo es válido
    const tiposValidos = ['Suscripción', 'Asesoría Individual', 'Clase Grupal', 'Pack de Citas'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ mensaje: 'Tipo de servicio no válido.' });
    }

    // Obtener servicios del tipo especificado
    const services = await Service.find({ tipo })
      .populate('entrenador')
      .populate('planesDePago')  // Cambiado de planDePago a planesDePago
      .populate('clientes');
    res.status(200).json(services);
  } catch (error) {
    console.error('❌ Error al obtener los servicios por tipo:', error);
    res.status(500).json({ mensaje: 'Error al obtener los servicios por tipo.', error: error.message });
  }
};


module.exports = {
  createService,
  createPaymentPlan,
  associateClientToPaymentPlan,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getAllPaymentPlans,
  getPaymentPlanById,
  updatePaymentPlan,
  deletePaymentPlan,
  getClientsByPaymentPlan,
  disassociateClientFromPaymentPlan,
  getServicesByType,

};
