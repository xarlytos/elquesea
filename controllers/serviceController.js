const Service = require('../models/Service');
const PaymentPlan = require('../models/PaymentPlan');
const Trainer = require('../models/Trainer');
const { validationResult } = require('express-validator');

exports.crearServicio = async (req, res) => {
  try {
    // Validación de campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Errores de validación:", errors.array());
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, descripcion, tipo, planDePago } = req.body;

    // Verificar que el entrenador existe
    const entrenador = await Trainer.findById(req.user.id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    // Crear el servicio sin el campo `planDePago`
    const nuevoServicio = new Service({
      nombre,
      descripcion,
      tipo,
      entrenador: req.user.id,
      fechaCreacion: Date.now(),
    });

    // Guardar el servicio
    const servicioGuardado = await nuevoServicio.save();
    console.log("Servicio guardado:", servicioGuardado);

    let planDePagoGuardado = null;

    // Si `planDePago` existe en el body, crear el plan de pago
    if (planDePago && planDePago.precio && planDePago.frecuencia) {
      planDePagoGuardado = new PaymentPlan({
        precio: planDePago.precio,
        moneda: planDePago.moneda || 'EUR',
        frecuencia: planDePago.frecuencia,
        detalles: planDePago.detalles,
        stripeProductId: planDePago.stripeProductId,
        stripePriceId: planDePago.stripePriceId,
        servicio: servicioGuardado._id,
      });

      // Guardar el plan de pago en la base de datos
      planDePagoGuardado = await planDePagoGuardado.save();
      console.log("Plan de pago guardado:", planDePagoGuardado);

      // Asociar el plan de pago al servicio
      servicioGuardado.planDePago = planDePagoGuardado._id;
      await servicioGuardado.save();
    }

    // Asociar el servicio al entrenador
    entrenador.servicios.push(servicioGuardado._id);
    await entrenador.save();

    res.status(201).json({ servicio: servicioGuardado, planDePago: planDePagoGuardado });
  } catch (error) {
    console.error("Error en crearServicio:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};

  exports.obtenerServicios = async (req, res) => {
    try {
      const servicios = await Service.find()
        .populate('entrenador', 'nombre email')
        .populate('planDePago');
      res.status(200).json(servicios);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  };
  exports.obtenerServicioPorId = async (req, res) => {
    try {
      const servicio = await Service.findById(req.params.id)
        .populate('entrenador', 'nombre email')
        .populate('planDePago');
      if (!servicio) {
        return res.status(404).json({ mensaje: 'Servicio no encontrado' });
      }
      res.status(200).json(servicio);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  };
  exports.actualizarServicio = async (req, res) => {
    try {
      const { nombre, descripcion, tipo } = req.body;
  
      // Construir objeto de actualización
      const nuevoServicio = {};
      if (nombre) nuevoServicio.nombre = nombre;
      if (descripcion) nuevoServicio.descripcion = descripcion;
      if (tipo) nuevoServicio.tipo = tipo;
  
      // Verificar que el servicio existe
      let servicio = await Service.findById(req.params.id);
      if (!servicio) {
        return res.status(404).json({ mensaje: 'Servicio no encontrado' });
      }
  
      // Verificar que el usuario es el propietario del servicio
      if (servicio.entrenador.toString() !== req.user.id) {
        return res.status(401).json({ mensaje: 'No autorizado' });
      }
  
      // Actualizar servicio
      servicio = await Service.findByIdAndUpdate(
        req.params.id,
        { $set: nuevoServicio },
        { new: true }
      );
  
      res.status(200).json(servicio);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  };
  exports.eliminarServicio = async (req, res) => {
    try {
      // Verificar que el servicio existe
      const servicio = await Service.findById(req.params.id);
      if (!servicio) {
        return res.status(404).json({ mensaje: 'Servicio no encontrado' });
      }
  
      // Verificar que el usuario es el propietario del servicio
      if (servicio.entrenador.toString() !== req.user.id) {
        return res.status(401).json({ mensaje: 'No autorizado' });
      }
  
      // Eliminar servicio
      await Service.findByIdAndRemove(req.params.id);
  
      // Opcional: Eliminar referencias en el entrenador
      await Trainer.findByIdAndUpdate(req.user.id, {
        $pull: { servicios: req.params.id },
      });
  
      res.status(200).json({ mensaje: 'Servicio eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  };
// Obtener todas las clases grupales
exports.obtenerClasesGrupales = async (req, res) => {
  try {
    console.log("Intentando obtener clases grupales sin populate...");
    const clasesGrupales = await Service.find({ tipo: 'Clase Grupal' });
    console.log("Clases grupales encontradas:", clasesGrupales);
    res.status(200).json(clasesGrupales);
  } catch (error) {
    console.error("Error al obtener clases grupales:", error.message);
    res.status(500).json({ mensaje: 'Error al obtener clases grupales', error: error.message });
  }
};
