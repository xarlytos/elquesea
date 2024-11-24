// controllers/serviceController.js
const { Service, PaymentPlan } = require('../models/Service');
const Client = require('../models/Client'); // Asegúrate de tener este modelo definido
const jwt = require('jsonwebtoken');

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
    const services = await Service.find().populate('entrenador').populate('planDePago').populate('clientes');
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
    const service = await Service.findById(serviceId).populate('entrenador').populate('planDePago').populate('clientes');
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
    // Asegurarse de que planDePago sea un arreglo y agregar el nuevo PaymentPlan
    servicioExistente.planDePago = servicioExistente.planDePago || [];
    servicioExistente.planDePago.push(savedPaymentPlan._id);
    await servicioExistente.save();
    console.log('🔄 Plan de pago asignado al servicio:', servicioExistente);

    res.status(201).json(savedPaymentPlan);
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

    // Asegurar que los arrays existen
    paymentPlan.clientes = paymentPlan.clientes || [];
    client.servicios = client.servicios || [];
    paymentPlan.servicio.clientes = paymentPlan.servicio.clientes || [];

    console.log('paymentPlan.clientes:', paymentPlan.clientes);
    console.log('client.servicios:', client.servicios);
    console.log('paymentPlan.servicio.clientes:', paymentPlan.servicio.clientes);

    // Asociar el cliente al plan de pago
    if (!paymentPlan.clientes.includes(client._id)) {
      paymentPlan.clientes.push(client._id);
      await paymentPlan.save();
    }

    // Asociar el servicio principal al cliente
    if (!client.servicios.includes(paymentPlan.servicio._id)) {
      client.servicios.push(paymentPlan.servicio._id);
      await client.save();
    }

    // Añadir el cliente al servicio principal
    if (!paymentPlan.servicio.clientes.includes(client._id)) {
      paymentPlan.servicio.clientes.push(client._id);
      await paymentPlan.servicio.save();
    }

    // Automatizar la creación de servicios adicionales
    if (paymentPlan.servicio.serviciosAdicionales && paymentPlan.servicio.serviciosAdicionales.length > 0) {
      console.log('🛠️ Creando servicios adicionales para el cliente...');
      for (const servicioAdicional of paymentPlan.servicio.serviciosAdicionales) {
        const newAdditionalService = new Service({
          nombre: servicioAdicional,
          descripcion: '',
          tipo: servicioAdicional, // Usar el nombre del servicio adicional como tipo
          entrenador: paymentPlan.servicio.entrenador,
          clientes: [client._id],
          fechaCreacion: new Date(),
        });

        const savedAdditionalService = await newAdditionalService.save();
        client.servicios.push(savedAdditionalService._id);
        await client.save();
        console.log('✅ Servicio adicional creado y asociado al cliente:', savedAdditionalService);
      }
    }

    res.status(200).json({ mensaje: 'Cliente asociado al plan de pago exitosamente.' });
  } catch (error) {
    console.error('❌ Error al asociar el cliente al plan de pago:', error);
    res.status(500).json({ mensaje: 'Error al asociar el cliente al plan de pago.', error: error.message });
  }
};

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
    const services = await Service.find({ tipo }).populate('entrenador').populate('planDePago').populate('clientes');
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
