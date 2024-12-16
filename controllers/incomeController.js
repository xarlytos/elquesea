const Income = require('../models/Income');

// Obtener todos los ingresos del entrenador autenticado
exports.obtenerIngresos = async (req, res) => {
  try {
    console.log('Iniciando obtención de ingresos...');
    console.log('ID del entrenador:', req.user.id);

    const ingresos = await Income.find({ entrenador: req.user.id })
      .populate('cliente', 'nombre email')
      .populate('planDePago', 'nombre precio')
      .sort({ fecha: -1 });
    
    console.log('Ingresos encontrados:', ingresos.length);
    console.log('Ingresos:', JSON.stringify(ingresos, null, 2));

    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ message: 'Error al obtener los ingresos' });
  }
};

// Obtener un ingreso por ID
exports.obtenerIngresoPorId = async (req, res) => {
  try {
    const ingreso = await Income.findById(req.params.id)
      .populate('cliente', 'nombre email')
      .populate('planDePago', 'nombre precio');
    if (!ingreso) return res.status(404).json({ message: 'Ingreso no encontrado' });
    res.status(200).json(ingreso);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el ingreso' });
  }
};

// Crear un nuevo ingreso (posible tras una transacción exitosa)
exports.crearIngreso = async (req, res) => {
  try {
    console.log('Datos recibidos en crearIngreso:', req.body);
    console.log('ID del entrenador:', req.user.id);

    // Mapear los campos correctamente
    const monto = req.body.importe;
    const cliente = req.body.clienteId;
    const planDePago = req.body.planId;
    const { 
      moneda, 
      descripcion, 
      metodoPago,
      estado = 'pendiente'
    } = req.body;

    console.log('Datos mapeados:', {
      monto,
      moneda,
      descripcion,
      cliente,
      planDePago,
      metodoPago,
      estado
    });

    // Validar método de pago
    if (!['stripe', 'efectivo'].includes(metodoPago)) {
      return res.status(400).json({ message: 'Método de pago no válido' });
    }

    // Crear ingreso usando el ID del entrenador autenticado (req.user.id)
    const nuevoIngreso = await Income.create({
      monto,
      moneda,
      descripcion,
      cliente,
      planDePago,
      metodoPago,
      estado,
      entrenador: req.user.id,
      fecha: req.body.fecha || new Date(),
    });

    // Populate los campos de referencia antes de enviar la respuesta
    await nuevoIngreso.populate('cliente', 'nombre email');
    await nuevoIngreso.populate('planDePago', 'nombre precio');

    res.status(201).json(nuevoIngreso);
  } catch (error) {
    console.error("Error al registrar el ingreso:", error);
    res.status(500).json({ message: 'Error al registrar el ingreso' });
  }
};

// Actualizar estado de un ingreso
exports.actualizarEstadoIngreso = async (req, res) => {
  try {
    const { estado } = req.body;
    
    // Validar estado
    if (!['pendiente', 'pagado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const ingreso = await Income.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate('cliente planDePago');

    if (!ingreso) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    res.json(ingreso);
  } catch (error) {
    console.error('Error al actualizar estado del ingreso:', error);
    res.status(500).json({ message: 'Error al actualizar el estado del ingreso' });
  }
};

// Actualizar un ingreso
exports.actualizarIngreso = async (req, res) => {
  try {
    console.log('Update Income Request Received');
    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);
    console.log('Request User:', req.user);

    const { importe, moneda, fecha, descripcion, categoria, tipo } = req.body;

    const ingreso = await Income.findById(req.params.id);
    console.log('Found Income:', ingreso);

    if (!ingreso) {
      console.log('Income Not Found');
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    // Verificar que el ingreso pertenece al usuario
    if (ingreso.entrenador.toString() !== req.user.id) {
      console.log('Unauthorized Update Attempt');
      return res.status(401).json({ message: 'No autorizado para actualizar este ingreso' });
    }

    const ingresoActualizado = await Income.findByIdAndUpdate(
      req.params.id,
      {
        importe,
        moneda,
        fecha,
        descripcion,
        categoria,
        tipo
      },
      { new: true }
    );

    console.log('Updated Income:', ingresoActualizado);
    res.json(ingresoActualizado);
  } catch (error) {
    console.error('Error Updating Income:', error);
    res.status(500).json({ message: 'Error al actualizar el ingreso', error: error.message });
  }
};

// Crear ingresos futuros basados en un plan de pago
exports.crearIngresosFuturos = async (planDePago, clienteId) => {
  try {
    console.log('=== Iniciando creación de ingresos futuros ===');
    console.log('Plan de pago:', {
      id: planDePago._id,
      nombre: planDePago.nombre,
      precio: planDePago.precio,
      frecuencia: planDePago.frecuencia,
      duracion: planDePago.duracion
    });
    console.log('Cliente ID:', clienteId);

    const ingresos = [];
    let fechaActual = new Date();
    
    // Calcular el intervalo y la duración total en meses
    let intervaloMeses = 1;
    let duracionTotal = planDePago.duracion; // número de pagos
    
    console.log('Calculando intervalos...');
    switch (planDePago.frecuencia) {
      case 'Único':
        console.log('Frecuencia: Único');
        intervaloMeses = 0;
        duracionTotal = 1;
        break;
      case 'Mensual':
        console.log('Frecuencia: Mensual');
        intervaloMeses = 1;
        // duracionTotal = duracionTotal (sin cambios, cada número es un mes)
        break;
      case 'Trimestral':
        console.log('Frecuencia: Trimestral');
        intervaloMeses = 3;
        duracionTotal = planDePago.duracion * 3; // cada número representa un trimestre
        break;
      case 'Anual':
        console.log('Frecuencia: Anual');
        intervaloMeses = 12;
        duracionTotal = planDePago.duracion * 12; // cada número representa un año
        break;
    }

    console.log('Configuración calculada:');
    console.log('- Intervalo en meses:', intervaloMeses);
    console.log('- Duración total en meses:', duracionTotal);

    // Calcular el número de pagos
    const numerosPagos = planDePago.frecuencia === 'Único' ? 1 : planDePago.duracion;
    console.log('Número total de pagos a crear:', numerosPagos);

    // Crear un ingreso por cada pago programado
    for (let i = 0; i < numerosPagos; i++) {
      const fechaPago = new Date(fechaActual);
      fechaPago.setMonth(fechaPago.getMonth() + (i * intervaloMeses));

      console.log(`Creando ingreso ${i + 1}/${numerosPagos}:`);
      console.log('- Fecha de pago:', fechaPago);
      console.log('- Monto:', planDePago.precio);
      console.log('- Estado:', i === 0 ? 'pagado' : 'pendiente');

      const nuevoIngreso = new Income({
        monto: planDePago.precio,
        moneda: planDePago.moneda,
        descripcion: `Pago ${i + 1}/${numerosPagos} - ${planDePago.nombre} (Cliente: ${clienteId})`,
        entrenador: planDePago.entrenador,
        cliente: clienteId,
        planDePago: planDePago._id,
        fecha: fechaPago,
        estado: i === 0 ? 'pagado' : 'pendiente',
        metodoPago: 'stripe' // agregar el método de pago
      });

      const ingresoGuardado = await nuevoIngreso.save();
      console.log('Ingreso guardado con ID:', ingresoGuardado._id);
      ingresos.push(ingresoGuardado);
    }

    console.log(`=== Completada la creación de ${ingresos.length} ingresos ===`);
    return ingresos;
  } catch (error) {
    console.error('Error al crear ingresos futuros:', error);
    throw error;
  }
};

// Eliminar un ingreso
exports.eliminarIngreso = async (req, res) => {
  try {
    console.log('Delete Income Request Received');
    console.log('Request Params:', req.params);
    console.log('Request User:', req.user);

    const ingreso = await Income.findById(req.params.id);
    console.log('Found Income:', ingreso);

    if (!ingreso) {
      console.log('Income Not Found');
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    await Income.deleteOne({ _id: req.params.id });
    console.log('Income Deleted Successfully');
    res.status(200).json({ message: 'Ingreso eliminado' });
  } catch (error) {
    console.error('Error Deleting Income:', error);
    res.status(500).json({ message: 'Error al eliminar el ingreso', error: error.message });
  }
};
