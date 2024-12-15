const RM = require('../models/RM');

// Crear un nuevo RM
exports.createRM = async (req, res) => {
  try {
    const { cliente, ejercicio, rm, fecha } = req.body;
    const trainer = req.user._id; // Obtener el ID del trainer del token

    const newRM = new RM({ 
      cliente, 
      ejercicio, 
      trainer, 
      rm, 
      fecha: fecha || new Date() 
    });
    
    await newRM.save();

    const populatedRM = await RM.findById(newRM._id)
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre');

    res.status(201).json(populatedRM);
  } catch (error) {
    console.error('Error al crear RM:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los RMs del trainer actual
exports.getAllRMs = async (req, res) => {
  try {
    const trainer = req.user._id;
    const rms = await RM.find({ trainer })
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre')
      .sort({ fecha: -1 }); // Ordenar por fecha descendente
    
    res.status(200).json(rms);
  } catch (error) {
    console.error('Error al obtener RMs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un RM por ID (solo si pertenece al trainer actual)
exports.getRMById = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = req.user._id;

    const rm = await RM.findOne({ _id: id, trainer })
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre');

    if (!rm) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json(rm);
  } catch (error) {
    console.error('Error al obtener RM por ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un RM (solo si pertenece al trainer actual)
exports.updateRM = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = req.user._id;
    const { cliente, ejercicio, rm, fecha } = req.body;

    const updatedRM = await RM.findOneAndUpdate(
      { _id: id, trainer },
      { cliente, ejercicio, rm, fecha },
      { new: true }
    )
    .populate('cliente', 'nombre')
    .populate('ejercicio', 'nombre')
    .populate('trainer', 'nombre');

    if (!updatedRM) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json(updatedRM);
  } catch (error) {
    console.error('Error al actualizar RM:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un RM (solo si pertenece al trainer actual)
exports.deleteRM = async (req, res) => {
  try {
    const { id } = req.params;
    const trainer = req.user._id;

    const deletedRM = await RM.findOneAndDelete({ _id: id, trainer });

    if (!deletedRM) {
      return res.status(404).json({ error: 'RM no encontrado' });
    }

    res.status(200).json({ message: 'RM eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar RM:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener RMs por cliente (solo los del trainer actual)
exports.getRMsByClient = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const trainer = req.user._id;

    const rms = await RM.find({ cliente: clienteId, trainer })
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre')
      .sort({ fecha: -1 });

    res.status(200).json(rms);
  } catch (error) {
    console.error('Error al obtener RMs por cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener RMs por ejercicio (solo los del trainer actual)
exports.getRMsByExercise = async (req, res) => {
  try {
    const { ejercicioId } = req.params;
    const trainer = req.user._id;

    const rms = await RM.find({ ejercicio: ejercicioId, trainer })
      .populate('cliente', 'nombre')
      .populate('ejercicio', 'nombre')
      .populate('trainer', 'nombre')
      .sort({ fecha: -1 });

    res.status(200).json(rms);
  } catch (error) {
    console.error('Error al obtener RMs por ejercicio:', error);
    res.status(500).json({ error: error.message });
  }
};
