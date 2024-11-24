const RM = require('../models/RM');

// Crear un nuevo RM
exports.createRM = async (req, res) => {
  try {
    const { cliente, ejercicio, trainer, rm, fecha } = req.body;

    const newRM = new RM({ cliente, ejercicio, trainer, rm, fecha });
    await newRM.save();

    res.status(201).json(newRM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los RM
exports.getAllRMs = async (req, res) => {
  try {
    const rms = await RM.find()
      .populate('cliente', 'nombre') // Populate cliente con su nombre
      .populate('ejercicio', 'nombre') // Populate ejercicio con su nombre
      .populate('trainer', 'nombre'); // Populate trainer con su nombre
    res.status(200).json(rms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un RM por ID
exports.getRMById = async (req, res) => {
  try {
    const { id } = req.params;
    const rm = await RM.findById(id)
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre');

    if (!rm) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json(rm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un RM
exports.updateRM = async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente, ejercicio, trainer, rm, fecha } = req.body;

    const updatedRM = await RM.findByIdAndUpdate(
      id,
      { cliente, ejercicio, trainer, rm, fecha },
      { new: true } // Devolver el documento actualizado
    );

    if (!updatedRM) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json(updatedRM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un RM
exports.deleteRM = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRM = await RM.findByIdAndDelete(id);

    if (!deletedRM) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json({ message: 'RM eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
