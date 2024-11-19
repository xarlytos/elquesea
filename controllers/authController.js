const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    trainer = new Trainer({
      nombre,
      email,
      password: hashedPassword,
      rol: 'trainer'
    });

    await trainer.save();

    res.status(201).json({ message: 'Entrenador registrado exitosamente' });
  } catch (error) {
    console.error('registerTrainer - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al registrar entrenador', error });
  }
};

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

// Inicio de sesión para entrenadores
exports.loginTrainer = async (req, res) => {
  try {
    console.log('loginTrainer - Request body:', req.body); // Log para ver los datos recibidos

    const { email, password } = req.body;
    const trainer = await Trainer.findOne({ email });
    
    if (!trainer || !(await bcrypt.compare(password, trainer.password))) {
      console.log('loginTrainer - Credenciales incorrectas para:', email); // Log si las credenciales son incorrectas
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: trainer._id, rol: 'trainer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: trainer._id, nombre: trainer.nombre, rol: trainer.rol } });
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

    const token = jwt.sign({ id: client._id, rol: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: client._id, nombre: client.nombre, rol: client.rol } });
  } catch (error) {
    console.error('loginClient - Error:', error); // Log para ver el error
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
};
