const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const { validationResult } = require('express-validator');

// Controlador para registrar un entrenador
exports.registrarEntrenador = async (req, res) => {
  try {
    // Validación de los campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, password } = req.body;

    // Verificar si el entrenador ya existe
    let entrenador = await Trainer.findOne({ email });
    if (entrenador) {
      return res.status(400).json({ mensaje: 'El entrenador ya está registrado' });
    }

    // Crear nuevo entrenador con el rol predeterminado 'trainer'
    entrenador = new Trainer({
      nombre,
      email,
      password,
      rol: 'trainer',  // Asegura que el rol se establece al crear el entrenador
    });

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    entrenador.password = await bcrypt.hash(password, salt);

    // Guardar el entrenador en la base de datos
    await entrenador.save();

    // Crear el payload del JWT con id y rol del entrenador
    const payload = {
      id: entrenador._id,
      role: entrenador.rol, // Esto debería ser 'trainer'
    };

    console.log("Payload antes de generar el token:", payload);

    // Generar y firmar el token JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
      (error, token) => {
        if (error) throw error;
        console.log("Token generado:", token);  // Verificación en consola
        res.status(201).json({ token });
      }
    );
  } catch (error) {
    console.error("Error al registrar entrenador:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};

// Controlador para obtener todos los entrenadores con contraseña y datos de relaciones
exports.obtenerEntrenadores = async (req, res) => {
  try {
    // Obtener todos los entrenadores incluyendo la contraseña y populando referencias
    const entrenadores = await Trainer.find()
      .populate('clientes')       // Asegúrate de que 'clientes' sea el campo adecuado en el esquema
      .populate('servicios')      // Igualmente, ajusta los nombres de los campos si son diferentes
      .populate('ingresos')
      .populate('gastos');
    
    res.status(200).json(entrenadores);
  } catch (error) {
    console.error("Error al obtener entrenadores:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};


// Obtener entrenador por ID
exports.obtenerEntrenadorPorId = async (req, res) => {
  try {
    const entrenador = await Trainer.findById(req.params.id).select('-password');
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }
    res.status(200).json(entrenador);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Actualizar entrenador
exports.actualizarEntrenador = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Construir objeto de actualización
    const nuevoEntrenador = {};
    if (nombre) nuevoEntrenador.nombre = nombre;
    if (email) nuevoEntrenador.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      nuevoEntrenador.password = await bcrypt.hash(password, salt);
    }

    // Verificar que el entrenador autenticado es el mismo que quiere actualizar
    let entrenador = await Trainer.findById(req.user.id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    // Actualizar entrenador en la base de datos
    entrenador = await Trainer.findByIdAndUpdate(
      req.user.id,
      { $set: nuevoEntrenador },
      { new: true }
    ).select('-password');

    res.status(200).json(entrenador);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Eliminar entrenador
exports.eliminarEntrenador = async (req, res) => {
  try {
    // Verificar que el entrenador existe
    const entrenador = await Trainer.findById(req.user.id);
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    // Eliminar entrenador de la base de datos
    await Trainer.findByIdAndRemove(req.user.id);
    res.status(200).json({ mensaje: 'Entrenador eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Obtener perfil del entrenador autenticado
exports.obtenerPerfilEntrenador = async (req, res) => {
  try {
    const entrenador = await Trainer.findById(req.user.id)
      .select('-password')
      .populate('servicios ingresos gastos');
    if (!entrenador) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }
    res.status(200).json(entrenador);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
// Crear una rutina simple sin semanas ni días
exports.createSimplePlanEntrenamiento = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, descripcion, duracion, fechaInicio, meta, cliente } = req.body;
    const entrenadorId = req.user.id;

    // Crear un nuevo plan de entrenamiento con solo los datos básicos
    const newPlan = new PlanEntrenamiento({
      nombre,
      descripcion,
      duracion,
      fechaInicio,
      meta,
      cliente,
      creador: entrenadorId,
      semanas: []  // Vacío para una rutina simple
    });

    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear rutina simple', error });
  }
};
