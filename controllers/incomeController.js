const Income = require('../models/Income');

// Obtener todos los ingresos del entrenador autenticado
exports.obtenerIngresos = async (req, res) => {
  try {
    const ingresos = await Income.find({ entrenador: req.user.id });
    res.status(200).json(ingresos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los ingresos' });
  }
};

// Obtener un ingreso por ID
exports.obtenerIngresoPorId = async (req, res) => {
  try {
    const ingreso = await Income.findById(req.params.id);
    if (!ingreso) return res.status(404).json({ message: 'Ingreso no encontrado' });
    res.status(200).json(ingreso);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el ingreso' });
  }
};

// Crear un nuevo ingreso (posible tras una transacción exitosa)
exports.crearIngreso = async (req, res) => {
  try {
    const { monto, moneda, descripcion } = req.body;

    // Crear ingreso usando el ID del entrenador autenticado (req.user.id)
    const nuevoIngreso = await Income.create({
      monto,
      moneda,
      descripcion,
      entrenador: req.user.id,
      fecha: new Date(),
    });

    res.status(201).json(nuevoIngreso);
  } catch (error) {
    console.error("Error al registrar el ingreso:", error);
    res.status(500).json({ message: 'Error al registrar el ingreso' });
  }
};


// Eliminar un ingreso
exports.eliminarIngreso = async (req, res) => {
  try {
    const ingreso = await Income.findById(req.params.id);
    if (!ingreso) return res.status(404).json({ message: 'Ingreso no encontrado' });

    await ingreso.remove();
    res.status(200).json({ message: 'Ingreso eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el ingreso' });
  }
};
