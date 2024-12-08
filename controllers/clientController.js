// clientController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer'); // Importar modelo Trainer
const Service = require('../models/Service');
const { Planning } = require('../models/Planning'); // Importar solo el modelo Planning
const { Dieta } = require('../models/Dieta');
const { validationResult } = require('express-validator');
const TrainerClientChat = require('../models/TrainerClientChat');
const Message = require('../models/Message');

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
      console.log('registrarCliente - Email en uso:', email);
      return res.status(400).json({ mensaje: 'El cliente ya está registrado' });
    }

    // Crear nuevo cliente asociado al entrenador autenticado
    cliente = new Client({
      nombre,
      email,
      password,
      trainer: req.user.id,
      // Información básica
      fechaNacimiento: null,
      genero: 'Prefiero no decirlo',
      telefono: '',
      
      // Información de contacto
      direccion: {
        calle: '',
        numero: '',
        piso: '',
        codigoPostal: '',
        ciudad: '',
        provincia: ''
      },
      
      // Información fisiológica
      altura: 0,
      peso: 0,
      condicionesMedicas: [],
      
      // Arrays inicializados
      redesSociales: [],
      tags: [],
      notas: []
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
      { $push: { clientes: cliente._id } }
    );
    console.log('registrarCliente - Cliente agregado al entrenador:', req.user.id);

    // Crear chat y enviar mensaje de bienvenida
    try {
      const chat = new TrainerClientChat({
        trainer: req.user.id,
        cliente: cliente._id
      });
      await chat.save();

      // Crear mensaje de bienvenida
      const mensaje = new Message({
        conversacion: chat._id,
        emisor: req.user.id,
        receptor: cliente._id,
        contenido: `¡Bienvenido/a ${cliente.nombre}! 👋 Soy tu entrenador personal y estoy aquí para ayudarte a alcanzar tus objetivos. No dudes en escribirme cualquier duda o consulta que tengas.`,
        tipo: 'texto'
      });
      await mensaje.save();

      // Actualizar el último mensaje del chat
      chat.ultimoMensaje = mensaje._id;
      chat.fechaUltimoMensaje = new Date();
      await chat.save();

      console.log('registrarCliente - Chat y mensaje de bienvenida creados');
    } catch (chatError) {
      console.error('Error al crear chat y mensaje de bienvenida:', chatError);
      // No detenemos el registro por un error en el chat
    }

    // Crear y firmar el JWT
    const payload = {
      id: cliente._id,
      role: 'client'
    };
    console.log('registrarCliente - Payload para JWT:', payload);

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    console.log('registrarCliente - Token generado:', token);

    res.status(201).json({ token });
  } catch (error) {
    console.error("registrarCliente - Error al registrar cliente:", error);
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
    console.log("obtenerPerfilCliente - ID del cliente:", req.user.id);  
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
    console.log('\n=== INICIANDO ACTUALIZACIÓN DE CLIENTE ===');
    console.log('Datos completos recibidos en req.body:', JSON.stringify(req.body, null, 2));
    console.log('Parámetros de la URL:', req.params);
    
    const { clientId } = req.params;
    console.log('ID del cliente a actualizar:', clientId);
    
    const { 
      nombre, 
      apellidos, 
      email, 
      telefono, 
      fechaNacimiento,
      genero,
      altura,
      peso,
      nivelActividad,
      estado,
      direccion,
      objetivos,
      restriccionesMedicas 
    } = req.body;
    
    console.log('\nDatos extraídos para actualización:');
    console.log('- Información básica:');
    console.log('  Nombre:', nombre);
    console.log('  Apellidos:', apellidos);
    console.log('  Email:', email);
    console.log('  Teléfono:', telefono);
    console.log('  Fecha Nacimiento:', fechaNacimiento);
    console.log('  Género:', genero);
    
    console.log('\n- Información física:');
    console.log('  Altura:', altura);
    console.log('  Peso:', peso);
    console.log('  Nivel de Actividad:', nivelActividad);
    
    console.log('\n- Estado y dirección:');
    console.log('  Estado:', estado);
    if (direccion) {
      console.log('  Dirección:', {
        calle: direccion.calle,
        numero: direccion.numero,
        piso: direccion.piso,
        codigoPostal: direccion.codigoPostal,
        ciudad: direccion.ciudad,
        provincia: direccion.provincia
      });
    }
    
    console.log('\n- Información adicional:');
    console.log('  Objetivos:', objetivos);
    console.log('  Restricciones Médicas:', restriccionesMedicas);

    // Verificar si el cliente existe
    console.log('\nBuscando cliente en la base de datos...');
    const cliente = await Client.findById(clientId);
    
    if (!cliente) {
      console.log('❌ Cliente no encontrado');
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }
    console.log('✅ Cliente encontrado:', cliente);

    // Actualizar los campos
    console.log('\nActualizando campos del cliente...');
    
    if (nombre) {
      console.log('Actualizando nombre:', nombre);
      cliente.nombre = nombre;
    }
    if (apellidos) {
      console.log('Actualizando apellidos:', apellidos);
      cliente.apellidos = apellidos;
    }
    if (email) {
      console.log('Actualizando email:', email);
      cliente.email = email;
    }
    if (telefono) {
      console.log('Actualizando teléfono:', telefono);
      cliente.telefono = telefono;
    }
    if (fechaNacimiento) {
      console.log('Actualizando fecha de nacimiento:', fechaNacimiento);
      cliente.fechaNacimiento = fechaNacimiento;
    }
    if (genero) {
      console.log('Actualizando género:', genero);
      cliente.genero = genero;
    }
    if (altura !== undefined) {
      console.log('Actualizando altura:', altura);
      cliente.altura = altura;
    }
    if (peso !== undefined) {
      console.log('Actualizando peso:', peso);
      cliente.peso = peso;
    }
    if (nivelActividad) {
      console.log('Actualizando nivel de actividad:', nivelActividad);
      cliente.nivelActividad = nivelActividad;
    }
    if (estado) {
      console.log('Actualizando estado:', estado);
      cliente.estado = estado;
    }
    if (direccion) {
      console.log('Actualizando dirección:', direccion);
      cliente.direccion = {
        calle: direccion.calle,
        numero: direccion.numero,
        piso: direccion.piso,
        codigoPostal: direccion.codigoPostal,
        ciudad: direccion.ciudad,
        provincia: direccion.provincia
      };
    }
    if (objetivos) {
      console.log('Actualizando objetivos:', objetivos);
      cliente.objetivos = objetivos;
    }
    if (restriccionesMedicas) {
      console.log('Actualizando restricciones médicas:', restriccionesMedicas);
      cliente.restriccionesMedicas = restriccionesMedicas;
    }

    console.log('\nGuardando cambios en la base de datos...');
    await cliente.save();
    console.log('✅ Cliente actualizado exitosamente');
    console.log('\nCliente después de la actualización:', cliente);
    console.log('\n=== FIN DE ACTUALIZACIÓN DE CLIENTE ===\n');

    res.json(cliente);
  } catch (error) {
    console.error('\n=== ERROR AL ACTUALIZAR CLIENTE ===');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje del error:', error.message);
    console.error('Stack del error:', error.stack);
    
    if (error.errors) {
      console.error('\nErrores de validación:');
      Object.keys(error.errors).forEach(field => {
        console.error(`Campo ${field}:`, error.errors[field].message);
      });
    }
    
    res.status(500).json({ 
      msg: 'Error al actualizar cliente', 
      error: error.message,
      detalles: error.errors ? error.errors : undefined
    });
  }
};

// Obtener información personal del cliente
exports.obtenerInformacionPersonal = async (req, res) => {
  try {
    const cliente = await Client.findById(req.params.clientId)
      .select('nombre email fechaNacimiento genero telefono direccion altura peso condicionesMedicas redesSociales');
    
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener información personal:', error);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar información básica del cliente
exports.actualizarInformacionBasica = async (req, res) => {
  try {
    const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
    
    const cliente = await Client.findById(req.params.clientId);
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    cliente.nombre = nombre || cliente.nombre;
    cliente.email = email || cliente.email;
    cliente.fechaNacimiento = fechaNacimiento || cliente.fechaNacimiento;
    cliente.genero = genero || cliente.genero;
    cliente.telefono = telefono || cliente.telefono;

    await cliente.save();
    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar información básica:', error);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar información física del cliente
exports.actualizarInformacionFisica = async (req, res) => {
  try {
    const { altura, peso } = req.body;
    
    const cliente = await Client.findById(req.params.clientId);
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    cliente.altura = altura || cliente.altura;
    cliente.peso = peso || cliente.peso;

    await cliente.save();
    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar información física:', error);
    res.status(500).send('Error del servidor');
  }
};

// Gestionar condiciones médicas
exports.gestionarCondicionesMedicas = async (req, res) => {
  try {
    const { condicionesMedicas } = req.body;
    
    const cliente = await Client.findById(req.params.clientId);
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    cliente.condicionesMedicas = condicionesMedicas;
    await cliente.save();
    res.json(cliente);
  } catch (error) {
    console.error('Error al gestionar condiciones médicas:', error);
    res.status(500).send('Error del servidor');
  }
};

// Gestionar redes sociales
exports.gestionarRedesSociales = async (req, res) => {
  try {
    const { redesSociales } = req.body;
    
    const cliente = await Client.findById(req.params.clientId);
    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    cliente.redesSociales = redesSociales;
    await cliente.save();
    res.json(cliente);
  } catch (error) {
    console.error('Error al gestionar redes sociales:', error);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar información de contacto
exports.actualizarContacto = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { direccion, redesSociales } = req.body;

    console.log('actualizarContacto - Datos recibidos:', { clientId, direccion, redesSociales });

    const cliente = await Client.findOne({ _id: clientId, trainer: req.user.id });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (direccion) cliente.direccion = direccion;
    if (redesSociales) cliente.redesSociales = redesSociales;

    await cliente.save();

    res.json({
      mensaje: 'Información de contacto actualizada correctamente',
      cliente
    });
  } catch (error) {
    console.error('Error en actualizarContacto:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar la información de contacto',
      error: error.message
    });
  }
};

// Actualizar información fisiológica
exports.actualizarInfoFisiologica = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { altura, peso, condicionesMedicas } = req.body;

    console.log('actualizarInfoFisiologica - Datos recibidos:', { clientId, altura, peso, condicionesMedicas });

    const cliente = await Client.findOne({ _id: clientId, trainer: req.user.id });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (altura) cliente.altura = altura;
    if (peso) cliente.peso = peso;
    if (condicionesMedicas) cliente.condicionesMedicas = condicionesMedicas;

    await cliente.save();

    res.json({
      mensaje: 'Información fisiológica actualizada correctamente',
      cliente
    });
  } catch (error) {
    console.error('Error en actualizarInfoFisiologica:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar la información fisiológica',
      error: error.message
    });
  }
};

// Gestionar tags del cliente
exports.gestionarTags = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tags } = req.body;

    console.log('gestionarTags - Datos recibidos:', { clientId, tags });

    const cliente = await Client.findOne({ _id: clientId, trainer: req.user.id });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    cliente.tags = tags;
    await cliente.save();

    res.json({
      mensaje: 'Tags actualizados correctamente',
      cliente
    });
  } catch (error) {
    console.error('Error en gestionarTags:', error);
    res.status(500).json({
      mensaje: 'Error al actualizar los tags',
      error: error.message
    });
  }
};

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

exports.obtenerClientePorId = async (req, res) => {
  try {
    console.log('=== INICIANDO BÚSQUEDA DE CLIENTE POR ID ===');
    console.log('Parámetros de la petición:', req.params);
    const clientId = req.params.clientId;
    console.log('ID del cliente a buscar:', clientId);

    // Validar formato del ID
    if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('ID inválido: no cumple con el formato de ObjectId');
      return res.status(400).json({ 
        msg: 'ID de cliente inválido',
        detalles: 'El ID debe ser una cadena de 24 caracteres hexadecimales'
      });
    }

    console.log('ID del trainer autenticado:', req.user.id);
    
    // Buscar cliente que pertenezca al trainer autenticado
    console.log('Buscando cliente en la base de datos...');
    const cliente = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    });

    console.log('Resultado de la búsqueda:', cliente);

    if (!cliente) {
      console.log('Cliente no encontrado o no pertenece al trainer');
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    console.log('Cliente encontrado exitosamente');
    res.json(cliente);
  } catch (error) {
    console.error('=== ERROR AL BUSCAR CLIENTE ===');
    console.error('Detalles del error:', error);
    console.error('Mensaje del error:', error.message);
    res.status(500).json({ 
      msg: 'Error al obtener cliente',
      error: error.message
    });
  }
};

exports.addNota = async (req, res) => {
  try {
    console.log('\n=== AGREGANDO NUEVA NOTA ===');
    console.log('Cliente ID:', req.params.clientId);
    console.log('Datos de la nota:', req.body);

    const { texto, categoria } = req.body;
    const clientId = req.params.clientId;

    // Verificar que el cliente pertenece al entrenador
    const client = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    });

    if (!client) {
      console.log('Cliente no encontrado o no autorizado');
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }

    // Crear la nueva nota
    const nuevaNota = {
      texto,
      categoria,
      fechaCreacion: new Date(),
      version: 1
    };

    // Agregar la nota al array de notas del cliente
    client.notas.push(nuevaNota);
    await client.save();

    console.log('Nota agregada exitosamente');
    res.status(201).json({
      status: 'success',
      data: nuevaNota
    });

  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al agregar la nota'
    });
  }
};

exports.getNotas = async (req, res) => {
  try {
    console.log('\n=== OBTENIENDO NOTAS DEL CLIENTE ===');
    console.log('Cliente ID:', req.params.clientId);

    const client = await Client.findOne({
      _id: req.params.clientId,
      trainer: req.user.id
    });

    if (!client) {
      console.log('Cliente no encontrado o no autorizado');
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }

    console.log('Notas encontradas:', client.notas.length);
    res.json({
      status: 'success',
      data: client.notas
    });

  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener las notas'
    });
  }
};

exports.updateNota = async (req, res) => {
  try {
    console.log('\n=== ACTUALIZANDO NOTA ===');
    console.log('Cliente ID:', req.params.clientId);
    console.log('Nota ID:', req.params.notaId);
    console.log('Datos de actualización:', req.body);

    const client = await Client.findOne({
      _id: req.params.clientId,
      trainer: req.user.id
    });

    if (!client) {
      console.log('Cliente no encontrado o no autorizado');
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }

    // Encontrar la nota específica
    const nota = client.notas.id(req.params.notaId);
    if (!nota) {
      console.log('Nota no encontrada');
      return res.status(404).json({
        status: 'error',
        message: 'Nota no encontrada'
      });
    }

    // Actualizar la nota
    if (req.body.texto) nota.texto = req.body.texto;
    if (req.body.categoria) nota.categoria = req.body.categoria;
    nota.version += 1; // Incrementar la versión

    await client.save();

    console.log('Nota actualizada exitosamente');
    res.json({
      status: 'success',
      data: nota
    });

  } catch (error) {
    console.error('Error al actualizar nota:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar la nota'
    });
  }
};

exports.deleteNota = async (req, res) => {
  try {
    console.log('\n=== ELIMINANDO NOTA ===');
    console.log('Cliente ID:', req.params.clientId);
    console.log('Nota ID:', req.params.notaId);

    const client = await Client.findOne({
      _id: req.params.clientId,
      trainer: req.user.id
    });

    if (!client) {
      console.log('Cliente no encontrado o no autorizado');
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }

    // Eliminar la nota
    client.notas.id(req.params.notaId).remove();
    await client.save();

    console.log('Nota eliminada exitosamente');
    res.json({
      status: 'success',
      message: 'Nota eliminada correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar nota:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al eliminar la nota'
    });
  }
};

exports.getNota = async (req, res) => {
  try {
    console.log('\n=== OBTENIENDO NOTA ESPECÍFICA ===');
    console.log('Cliente ID:', req.params.clientId);
    console.log('Nota ID:', req.params.notaId);

    const client = await Client.findOne({
      _id: req.params.clientId,
      trainer: req.user.id
    });

    if (!client) {
      console.log('Cliente no encontrado o no autorizado');
      return res.status(404).json({
        status: 'error',
        message: 'Cliente no encontrado'
      });
    }

    const nota = client.notas.id(req.params.notaId);
    if (!nota) {
      console.log('Nota no encontrada');
      return res.status(404).json({
        status: 'error',
        message: 'Nota no encontrada'
      });
    }

    console.log('Nota encontrada');
    res.json({
      status: 'success',
      data: nota
    });

  } catch (error) {
    console.error('Error al obtener nota:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener la nota'
    });
  }
};

exports.asignarPlanning = async (req, res) => {
  try {
    console.log('\n=== INICIANDO ASIGNACIÓN DE PLANNING ===');
    console.log('Hora de inicio:', new Date().toISOString());
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('Parámetros URL:', req.params);

    const { clientId, planningId } = req.params;
    console.log('\nIDs extraídos:');
    console.log('- Cliente ID:', clientId);
    console.log('- Planning ID:', planningId);
    console.log('- Trainer ID (del token):', req.user.id);

    // Verificar formato de IDs
    console.log('\nVerificando formato de IDs...');
    if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ ID de cliente inválido:', clientId);
      return res.status(400).json({ 
        msg: 'ID de cliente inválido',
        detalles: 'El ID debe ser una cadena de 24 caracteres hexadecimales'
      });
    }
    if (!planningId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ ID de planning inválido:', planningId);
      return res.status(400).json({ 
        msg: 'ID de planning inválido',
        detalles: 'El ID debe ser una cadena de 24 caracteres hexadecimales'
      });
    }
    console.log('✅ Formato de IDs válido');

    // Primero buscar el cliente sin filtro de trainer
    console.log('\nBuscando cliente sin filtro de trainer...');
    const clienteSinFiltro = await Client.findById(clientId);
    console.log('Resultado sin filtro:', clienteSinFiltro ? {
      id: clienteSinFiltro._id,
      trainer: clienteSinFiltro.trainer,
      nombre: clienteSinFiltro.nombre
    } : 'No encontrado');

    // Ahora buscar con el filtro de trainer
    console.log('\nBuscando cliente con filtro de trainer...');
    const queryObj = {
      _id: clientId,
      trainer: req.user.id
    };
    console.log('Query a ejecutar:', JSON.stringify(queryObj, null, 2));
    
    const cliente = await Client.findOne(queryObj);
    
    console.log('Resultado de la búsqueda:', cliente ? {
      id: cliente._id,
      trainer: cliente.trainer,
      nombre: cliente.nombre
    } : 'No encontrado');

    if (!cliente) {
      console.log('❌ Cliente no encontrado o no pertenece al trainer');
      console.log('Comparación de IDs:');
      if (clienteSinFiltro) {
        console.log('- ID del trainer del cliente:', clienteSinFiltro.trainer.toString());
        console.log('- ID del trainer autenticado:', req.user.id);
        console.log('- ¿Son iguales?:', clienteSinFiltro.trainer.toString() === req.user.id);
      }
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    // Verificar si el planning existe
    console.log('\nBuscando planning en la base de datos...');
    const planning = await Planning.findById(planningId);
    if (!planning) {
      console.log('❌ Planning no encontrado');
      return res.status(404).json({ msg: 'Planning no encontrado' });
    }
    console.log('✅ Planning encontrado:', {
      id: planning._id,
      nombre: planning.nombre,
      descripcion: planning.descripcion,
      fechaInicio: planning.fechaInicio
    });

    // Verificar si el planning ya está asignado al cliente
    console.log('\nVerificando si el planning ya está asignado...');
    console.log('Plannings actuales del cliente:', cliente.plannings);
    if (cliente.plannings.includes(planningId)) {
      console.log('⚠️ El planning ya está asignado al cliente');
      return res.status(400).json({ msg: 'El planning ya está asignado a este cliente' });
    }
    console.log('✅ El planning no está asignado previamente');

    // Agregar el planning a la lista de plannings del cliente
    console.log('\nAgregando planning al cliente...');
    cliente.plannings.push(planningId);
    
    // Si no hay planning activo, establecer este como activo
    if (!cliente.planningActivo) {
      console.log('ℹ️ No hay planning activo, estableciendo este como activo');
      cliente.planningActivo = planningId;
    } else {
      console.log('ℹ️ Ya existe un planning activo:', cliente.planningActivo);
    }

    console.log('\nGuardando cambios en la base de datos...');
    await cliente.save();
    console.log('✅ Cambios guardados exitosamente');

    // Obtener cliente actualizado con los plannings populados
    console.log('\nObteniendo datos actualizados del cliente...');
    const clienteActualizado = await Client.findById(clientId)
      .populate('plannings', 'nombre descripcion fechaInicio')
      .populate('planningActivo', 'nombre descripcion fechaInicio');

    console.log('✅ Datos actualizados obtenidos:', {
      totalPlannings: clienteActualizado.plannings.length,
      planningActivo: clienteActualizado.planningActivo ? clienteActualizado.planningActivo.nombre : 'Ninguno'
    });

    console.log('\n=== FIN DE ASIGNACIÓN DE PLANNING ===');
    console.log('Hora de finalización:', new Date().toISOString());

    res.json({
      msg: 'Planning asignado exitosamente',
      cliente: clienteActualizado
    });

  } catch (error) {
    console.error('\n=== ERROR AL ASIGNAR PLANNING ===');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje del error:', error.message);
    console.error('Stack del error:', error.stack);
    
    if (error.errors) {
      console.error('\nErrores de validación:');
      Object.keys(error.errors).forEach(field => {
        console.error(`Campo ${field}:`, error.errors[field].message);
      });
    }

    console.error('\nContexto del error:');
    console.error('- URL:', req.originalUrl);
    console.error('- Método:', req.method);
    console.error('- IP:', req.ip);
    console.error('- Usuario:', req.user ? req.user.id : 'No autenticado');

    res.status(500).json({ 
      msg: 'Error al asignar planning', 
      error: error.message,
      detalles: error.errors ? error.errors : undefined
    });
  }
};

exports.establecerPlanningActivo = async (req, res) => {
  try {
    console.log('\n=== INICIANDO CAMBIO DE PLANNING ACTIVO ===');
    const { clientId, planningId } = req.params;
    console.log('Cliente ID:', clientId);
    console.log('Nuevo Planning Activo ID:', planningId);

    // Verificar si el cliente existe y pertenece al trainer
    const cliente = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado o no pertenece al trainer');
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    // Verificar si el planning existe y está asignado al cliente
    if (!cliente.plannings.includes(planningId)) {
      console.log('❌ El planning no está asignado a este cliente');
      return res.status(400).json({ 
        msg: 'Planning no válido',
        detalles: 'El planning debe estar primero asignado al cliente'
      });
    }

    // Establecer el nuevo planning activo
    cliente.planningActivo = planningId;
    await cliente.save();
    console.log('✅ Planning activo actualizado exitosamente');

    res.json({
      msg: 'Planning activo actualizado exitosamente',
      cliente: await Client.findById(clientId)
        .populate('plannings', 'nombre descripcion fechaInicio')
        .populate('planningActivo', 'nombre descripcion fechaInicio')
    });

  } catch (error) {
    console.error('\n=== ERROR AL CAMBIAR PLANNING ACTIVO ===');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje del error:', error.message);
    console.error('Stack del error:', error.stack);
    res.status(500).json({ 
      msg: 'Error al cambiar planning activo', 
      error: error.message 
    });
  }
};

exports.obtenerPlanningsCliente = async (req, res) => {
  try {
    console.log('\n=== INICIANDO OBTENCIÓN DE PLANNINGS ===');
    const { clientId } = req.params;
    console.log('Cliente ID:', clientId);

    const cliente = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    }).populate('plannings').populate('planningActivo');

    if (!cliente) {
      console.log('❌ Cliente no encontrado o no pertenece al trainer');
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    console.log('✅ Plannings obtenidos exitosamente');
    res.json({
      plannings: cliente.plannings,
      planningActivo: cliente.planningActivo
    });

  } catch (error) {
    console.error('\n=== ERROR AL OBTENER PLANNINGS ===');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje del error:', error.message);
    console.error('Stack del error:', error.stack);
    res.status(500).json({ 
      msg: 'Error al obtener plannings', 
      error: error.message 
    });
  }
};

exports.asignarDieta = async (req, res) => {
  console.log('=== INICIANDO ASIGNACIÓN DE DIETA ===');
  console.log('Hora de inicio:', new Date().toISOString());
  console.log('Body recibido:', req.body);
  console.log('Parámetros URL:', req.params);

  try {
    const { clientId, dietaId } = req.params;
    const trainerId = req.user.id;

    console.log('\nIDs extraídos:');
    console.log('- Cliente ID:', clientId);
    console.log('- Dieta ID:', dietaId);
    console.log('- Trainer ID (del token):', trainerId);

    // Verificar formato de IDs
    console.log('\nVerificando formato de IDs...');
    if (!mongoose.Types.ObjectId.isValid(clientId) || 
        !mongoose.Types.ObjectId.isValid(dietaId) || 
        !mongoose.Types.ObjectId.isValid(trainerId)) {
      console.log('❌ Error: Formato de ID inválido');
      return res.status(400).json({ mensaje: 'Formato de ID inválido' });
    }
    console.log('✅ Formato de IDs válido');

    // Buscar el cliente
    console.log('\nBuscando cliente en la base de datos...');
    const cliente = await Client.findById(clientId);
    if (!cliente) {
      console.log('❌ Error: Cliente no encontrado');
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    console.log('✅ Cliente encontrado:', {
      id: cliente._id,
      nombre: cliente.nombre,
      email: cliente.email,
      dietasActuales: cliente.dietas ? cliente.dietas.length : 0
    });

    // Buscar la dieta
    console.log('\nBuscando dieta en la base de datos...');
    const dieta = await Dieta.findById(dietaId);
    if (!dieta) {
      console.log('❌ Error: Dieta no encontrada');
      return res.status(404).json({ mensaje: 'Dieta no encontrada' });
    }
    console.log('✅ Dieta encontrada:', {
      id: dieta._id,
      nombre: dieta.nombre,
      estado: dieta.estado
    });

    // Verificar que la dieta pertenezca al trainer
    if (dieta.trainer.toString() !== trainerId) {
      console.log('❌ Error: La dieta no pertenece al trainer');
      return res.status(403).json({ mensaje: 'No tienes permiso para asignar esta dieta' });
    }
    console.log('✅ Verificación de trainer correcta');

    // Verificar si la dieta ya está asignada al cliente
    if (cliente.dietas && cliente.dietas.includes(dietaId)) {
      console.log('❌ Error: La dieta ya está asignada al cliente');
      return res.status(400).json({ mensaje: 'Esta dieta ya está asignada al cliente' });
    }

    // Asignar la dieta al cliente
    console.log('\nAsignando dieta al cliente...');
    if (!cliente.dietas) {
      cliente.dietas = [];
    }
    cliente.dietas.push(dietaId);

    // Si no hay dieta activa, establecer esta como activa
    if (!cliente.dietaActiva) {
      cliente.dietaActiva = dietaId;
      console.log('✅ Dieta establecida como activa por ser la primera');
    }

    // Guardar los cambios
    await cliente.save();
    console.log('✅ Cambios guardados exitosamente');

    // Enviar respuesta
    console.log('\n=== ASIGNACIÓN DE DIETA COMPLETADA ===');
    res.json({
      mensaje: 'Dieta asignada correctamente',
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        dietasTotal: cliente.dietas.length,
        dietaActiva: cliente.dietaActiva
      }
    });

  } catch (error) {
    console.log('\n=== ERROR AL ASIGNAR DIETA ===');
    console.log('Tipo de error:', error.constructor.name);
    console.log('Mensaje del error:', error.message);
    console.log('Stack del error:', error.stack);
    
    res.status(500).json({
      mensaje: 'Error al asignar la dieta',
      error: error.message
    });
  }
};

exports.establecerDietaActiva = async (req, res) => {
  try {
    console.log('\n=== ESTABLECIENDO DIETA ACTIVA ===');
    const { clientId, dietaId } = req.params;
    console.log('Cliente ID:', clientId);
    console.log('Nueva Dieta Activa ID:', dietaId);

    // Verificar si el cliente existe y pertenece al trainer
    const cliente = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado o no pertenece al trainer');
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    // Verificar si la dieta está asignada al cliente
    if (!cliente.dietas.includes(dietaId)) {
      console.log('❌ La dieta no está asignada al cliente');
      return res.status(400).json({ 
        msg: 'La dieta no está asignada a este cliente',
        detalles: 'Primero debe asignar la dieta al cliente'
      });
    }

    // Establecer la dieta como activa
    cliente.dietaActiva = dietaId;
    await cliente.save();

    // Obtener cliente actualizado
    const clienteActualizado = await Client.findById(clientId)
      .populate('dietas')
      .populate('dietaActiva');

    console.log('✅ Dieta activa establecida exitosamente');
    res.json({
      msg: 'Dieta activa actualizada exitosamente',
      cliente: clienteActualizado
    });

  } catch (error) {
    console.error('Error al establecer dieta activa:', error);
    res.status(500).json({ 
      msg: 'Error al establecer dieta activa',
      error: error.message 
    });
  }
};

exports.obtenerDietasCliente = async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log('Cliente ID:', clientId);

    const cliente = await Client.findOne({
      _id: clientId,
      trainer: req.user.id
    }).populate('dietas').populate('dietaActiva');

    if (!cliente) {
      console.log('❌ Cliente no encontrado o no pertenece al trainer');
      return res.status(404).json({ 
        msg: 'Cliente no encontrado',
        detalles: 'El cliente no existe o no pertenece al trainer autenticado'
      });
    }

    res.json({
      dietas: cliente.dietas,
      dietaActiva: cliente.dietaActiva
    });

  } catch (error) {
    console.error('Error al obtener dietas del cliente:', error);
    res.status(500).json({ 
      msg: 'Error al obtener dietas',
      error: error.message 
    });
  }
};
