// authController.js

const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Definir el secreto JWT directamente en el código (Solo para pruebas)
const JWT_SECRET = 'tu_secreto_super_seguro';
const JWT_EXPIRES_IN = '24h'; // Tiempo de expiración del token aumentado a 24 horas

// Registro de un nuevo entrenador
exports.registerTrainer = async (req, res) => {
  try {
    console.log('registerTrainer - Request body:', req.body); // Log para ver los datos recibidos

    const { nombre, email, password } = req.body;

    let trainer = await Trainer.findOne({ email });
    if (trainer) {
      console.log('registerTrainer - Email en uso:', email); // Log si el correo ya existe
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('registerTrainer - Hashed password:', hashedPassword); // Log del password encriptado

    trainer = new Trainer({
      nombre,
      email,
      password: hashedPassword,
      rol: 'trainer'
    });

    await trainer.save();
    console.log('registerTrainer - Trainer saved:', trainer); // Log del entrenador guardado

    res.status(201).json({ message: 'Entrenador registrado exitosamente' });
  } catch (error) {
    console.error('registerTrainer - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al registrar entrenador', error });
  }
};

// Inicio de sesión para entrenadores


// Similarmente, asegúrate de que cualquier otra función que firme tokens JWT use JWT_SECRET correctamente

// Registro de un nuevo cliente
exports.registerClient = async (req, res) => {
  try {
    console.log('registerClient - Request body:', req.body); // Log para ver los datos recibidos

    const { nombre, email, password } = req.body;

    let client = await Client.findOne({ email });
    if (client) {
      console.log('registerClient - Email en uso:', email); // Log si el correo ya existe
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    client = new Client({
      nombre,
      email,
      password: hashedPassword,
      rol: 'client'
    });

    await client.save();

    res.status(201).json({ message: 'Cliente registrado exitosamente' });
  } catch (error) {
    console.error('registerClient - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al registrar cliente', error });
  }
};

exports.loginTrainer = async (req, res) => {
  try {
    console.log('loginTrainer - Request body:', req.body); // Log para ver los datos recibidos

    const { email, password } = req.body;
    const trainer = await Trainer.findOne({ email });
    console.log('loginTrainer - Trainer found:', trainer); // Log del entrenador encontrado

    if (!trainer || !(await bcrypt.compare(password, trainer.password))) {
      console.log('loginTrainer - Credenciales incorrectas para:', email); // Log si las credenciales son incorrectas
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const payload = { id: trainer._id, rol: 'trainer' };
    console.log('loginTrainer - Payload for JWT:', payload); // Log del payload

    const token = jwt.sign(
      payload,
      JWT_SECRET, // Uso del secreto definido directamente
      { expiresIn: JWT_EXPIRES_IN } // Uso del tiempo de expiración definido directamente
    );
    console.log('loginTrainer - Token generado:', token); // Log del token generado

    // Incluir el email en el objeto user de la respuesta
    res.json({
      token,
      user: {
        id: trainer._id,
        nombre: trainer.nombre,
        email: trainer.email, // Asegúrate de que esta línea está presente
        rol: trainer.rol
      }
    });
  } catch (error) {
    console.error('loginTrainer - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
};

// Inicio de sesión para clientes
exports.loginClient = async (req, res) => {
  try {
    console.log('loginClient - Request body:', req.body); // Log para ver los datos recibidos

    const { email, password } = req.body;
    const client = await Client.findOne({ email });

    if (!client || !(await bcrypt.compare(password, client.password))) {
      console.log('loginClient - Credenciales incorrectas para:', email); // Log si las credenciales son incorrectas
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: client._id, rol: 'client' },
      JWT_SECRET, // Uso del secreto definido directamente
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: client._id, nombre: client.nombre, rol: client.rol } });
  } catch (error) {
    console.error('loginClient - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
};
