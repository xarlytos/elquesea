// clientController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer'); // Importar modelo Trainer
const { validationResult } = require('express-validator');

// Definir el secreto JWT directamente en el controlador (Solo para pruebas)
const JWT_SECRET = 'tu_secreto_super_seguro'; // Reemplaza con una cadena más segura
const JWT_EXPIRES_IN = '24h'; // Tiempo de expiración del token aumentado a 24 horas

exports.registrarCliente = async (req, res) => {
  try {
    console.log('registrarCliente - Iniciando registro de cliente');

    // Validación de campos
    const errors = validationResult(req);
    console.log('registrarCliente - Validando campos:', errors.array());
    if (!errors.isEmpty()) {
      console.log('registrarCliente - Errores de validación:', errors.array());
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, password } = req.body;
    console.log('registrarCliente - Datos recibidos:', { nombre, email, password });

    // Verificar si el cliente ya existe
    let cliente = await Client.findOne({ email });
    if (cliente) {
      console.log('registrarCliente - Email en uso:', email); // Log si el correo ya existe
      return res.status(400).json({ mensaje: 'El cliente ya está registrado' });
    }

    // Crear nuevo cliente asociado al entrenador autenticado
    cliente = new Client({
      nombre,
      email,
      password,
      trainer: req.user.id // ID del entrenador autenticado
    });
    console.log('registrarCliente - Nuevo cliente creado:', cliente);

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    console.log('registrarCliente - Salt generado:', salt);
    cliente.password = await bcrypt.hash(password, salt);
    console.log('registrarCliente - Contraseña encriptada:', cliente.password);

    // Guardar en la base de datos
    await cliente.save();
    console.log('registrarCliente - Cliente guardado en la base de datos');

    // Actualizar la lista de clientes del entrenador
    await Trainer.findByIdAndUpdate(
      req.user.id,
      { $push: { clientes: cliente._id } } // Agregar cliente al entrenador
    );
    console.log('registrarCliente - Cliente agregado al entrenador:', req.user.id);

    // Crear y firmar el JWT
    const payload = {
      id: cliente._id,
      role: 'client'
    };
    console.log('registrarCliente - Payload para JWT:', payload);

    const token = jwt.sign(
      payload,
      JWT_SECRET, // Uso del secreto definido directamente
      { expiresIn: JWT_EXPIRES_IN } // Uso del tiempo de expiración definido directamente
    );
    console.log('registrarCliente - Token generado:', token);

    res.status(201).json({ token });
  } catch (error) {
    console.error("registrarCliente - Error al registrar cliente:", error); // Log para ver el error
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    console.log("obtenerClientes - Obteniendo clientes para el trainer:", req.user.id);
    const clientes = await Client.find({ trainer: req.user.id }).select('-password');
    console.log("obtenerClientes - Clientes encontrados:", clientes);
    res.status(200).json(clientes);
  } catch (error) {
    console.error("obtenerClientes - Error al obtener clientes:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

// Obtener perfil del cliente autenticado
exports.obtenerPerfilCliente = async (req, res) => {
  try {
    console.log("obtenerPerfilCliente - ID del cliente:", req.user.id);  // Verifica que `req.user.id` esté presente
    const cliente = await Client.findById(req.user.id)
      .select('-password')
      .populate('planesDePago transacciones');
    if (!cliente) {
      console.log("obtenerPerfilCliente - Cliente no encontrado:", req.user.id);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    console.log("obtenerPerfilCliente - Perfil del cliente encontrado:", cliente);
    res.status(200).json(cliente);
  } catch (error) {
    console.error("obtenerPerfilCliente - Error al obtener el perfil del cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

// Actualizar perfil del cliente autenticado
exports.actualizarCliente = async (req, res) => {
  try {
    console.log("actualizarCliente - Iniciando actualización de cliente");
    const { nombre, email, password } = req.body;
    console.log("actualizarCliente - Datos de actualización recibidos:", { nombre, email, password });

    const nuevoCliente = {};
    if (nombre) {
      nuevoCliente.nombre = nombre;
      console.log("actualizarCliente - Nombre actualizado:", nombre);
    }
    if (email) {
      nuevoCliente.email = email;
      console.log("actualizarCliente - Email actualizado:", email);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      console.log("actualizarCliente - Salt generado para nueva contraseña:", salt);
      nuevoCliente.password = await bcrypt.hash(password, salt);
      console.log("actualizarCliente - Nueva contraseña encriptada:", nuevoCliente.password);
    }

    console.log("actualizarCliente - ID del cliente:", req.user.id);
    let cliente = await Client.findById(req.user.id);
    if (!cliente) {
      console.log("actualizarCliente - Cliente no encontrado:", req.user.id);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    console.log("actualizarCliente - Cliente antes de la actualización:", cliente);

    cliente = await Client.findByIdAndUpdate(
      req.user.id,
      { $set: nuevoCliente },
      { new: true }
    ).select('-password');
    console.log("actualizarCliente - Cliente actualizado:", cliente);

    res.status(200).json(cliente);
  } catch (error) {
    console.error("actualizarCliente - Error al actualizar el cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};

// Eliminar cliente autenticado
exports.eliminarCliente = async (req, res) => {
  try {
    console.log("eliminarCliente - ID del cliente:", req.user.id);
    const cliente = await Client.findById(req.user.id);
    if (!cliente) {
      console.log("eliminarCliente - Cliente no encontrado:", req.user.id);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    await Client.findByIdAndRemove(req.user.id);
    console.log("eliminarCliente - Cliente eliminado:", cliente);
    res.status(200).json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error("eliminarCliente - Error al eliminar el cliente:", error);
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
};
