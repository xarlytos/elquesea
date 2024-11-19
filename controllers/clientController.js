const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer'); // Importar modelo Trainer

const { validationResult } = require('express-validator');

exports.registrarCliente = async (req, res) => {
  try {
    // Validación de campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, password } = req.body;

    // Verificar si el cliente ya existe
    let cliente = await Client.findOne({ email });
    if (cliente) {
      return res.status(400).json({ mensaje: 'El cliente ya está registrado' });
    }

    // Crear nuevo cliente asociado al entrenador autenticado
    cliente = new Client({
      nombre,
      email,
      password,
      trainer: req.user.id // ID del entrenador autenticado
    });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    cliente.password = await bcrypt.hash(password, salt);

    // Guardar en la base de datos
    await cliente.save();

    // Actualizar la lista de clientes del entrenador
    await Trainer.findByIdAndUpdate(
      req.user.id,
      { $push: { clientes: cliente._id } } // Agregar cliente al entrenador
    );

    // Crear y firmar el JWT
    const payload = {
      id: cliente._id,
      role: 'client'
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (error, token) => {
        if (error) throw error;
        res.status(201).json({ token });
      }
    );
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    console.log("🔍 Obteniendo clientes para el trainer:", req.user.id);
    const clientes = await Client.find({ trainer: req.user.id }).select('-password');
    console.log("✅ Clientes encontrados:", clientes);
    res.status(200).json(clientes);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};


// Obtener perfil del cliente autenticado
exports.obtenerPerfilCliente = async (req, res) => {
  try {
    console.log("ID del cliente en obtenerPerfilCliente:", req.user.id);  // Verifica que `req.user.id` esté presente
    const cliente = await Client.findById(req.user.id)
      .select('-password')
      .populate('planesDePago transacciones');
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    console.log("Perfil del cliente encontrado:", cliente);
    res.status(200).json(cliente);
  } catch (error) {
    console.error("Error al obtener el perfil del cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Actualizar perfil del cliente autenticado
exports.actualizarCliente = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    console.log("Datos de actualización recibidos:", { nombre, email, password });

    const nuevoCliente = {};
    if (nombre) nuevoCliente.nombre = nombre;
    if (email) nuevoCliente.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      nuevoCliente.password = await bcrypt.hash(password, salt);
    }

    console.log("ID del cliente en actualizarCliente:", req.user.id);
    let cliente = await Client.findById(req.user.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    cliente = await Client.findByIdAndUpdate(
      req.user.id,
      { $set: nuevoCliente },
      { new: true }
    ).select('-password');

    console.log("Cliente actualizado:", cliente);
    res.status(200).json(cliente);
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

// Eliminar cliente autenticado
exports.eliminarCliente = async (req, res) => {
  try {
    console.log("ID del cliente en eliminarCliente:", req.user.id);
    const cliente = await Client.findById(req.user.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    await Client.findByIdAndRemove(req.user.id);
    console.log("Cliente eliminado:", cliente);
    res.status(200).json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
