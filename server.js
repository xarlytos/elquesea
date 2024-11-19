const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importar cors

// Configuración directa en el código
const PORT = 3000; // O cualquier otro puerto que desees
const MONGODB_URI = "mongodb+srv://xarlytos:NxRCGi5eCbxNKj31@xarlytos.c7diz.mongodb.net/usersddb?retryWrites=true&w=majority&appName=xarlytos";

// Crear una instancia de la aplicación de Express
const app = express();

// Opciones de conexión para Mongoose
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: false, // Asegura que los certificados sean válidos
    // Si es necesario, puedes agregar más opciones aquí
};

// Conexión a MongoDB usando Mongoose
mongoose.connect(MONGODB_URI, options)
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error de conexión:', err));

// Middleware para habilitar CORS de forma global (permite todos los orígenes)
app.use(cors());

// Middleware para manejar solicitudes preflight
app.options('*', cors()); // Responder a solicitudes preflight en todas las rutas

// Middleware para leer JSON en las solicitudes
app.use(express.json());

// Importar las rutas desde la carpeta routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const paymentPlanRoutes = require('./routes/paymentPlanRoutes');
const planEntrenamientoRoutes = require('./routes/planEntrenamientoRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/ejercicios', exerciseRoutes);
app.use('/api/gastos', expenseRoutes);
app.use('/api/ingresos', incomeRoutes);
app.use('/api/planes-de-pago', paymentPlanRoutes);
app.use('/api/planes-entrenamiento', planEntrenamientoRoutes);
app.use('/api/servicios', serviceRoutes);
app.use('/api/entrenadores', trainerRoutes);
app.use('/api/transacciones', transactionRoutes);
app.use('/api/chat', chatRoutes);

// Middleware para manejar errores genéricos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocurrió un error en el servidor', error: err.message });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
