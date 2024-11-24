const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importar cors
require('dotenv').config(); // Carga las variables de entorno

// Configuración específica de CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'https://crmactualizado-f9oy.vercel.app'], // Agrega tu dominio de producción
  credentials: true, // Permitir el envío de cookies y credenciales
};


// Configuración de los puertos y la URI de MongoDB
const PORT = process.env.PORT || 3000;
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

// Middleware para habilitar CORS con opciones específicas
app.use(cors(corsOptions));

// Middleware para manejar solicitudes preflight con opciones específicas
app.options('*', cors(corsOptions));

// Middleware para leer JSON en las solicitudes
app.use(express.json());

// Importar las rutas desde la carpeta routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const paymentPlanRoutes = require('./routes/paymentPlanRoutes');
const planEntrenamientoRoutes = require('./routes/planEntrenamientoRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const planningRoutes = require('./routes/planningRoutes');
const dietaRoutes = require('./routes/dietas');
const cuestionarioRoutes = require('./routes/cuestionarioRoutes');
const emailMarketingRoutes = require("./routes/emailMarketingRoutes");
const reportRoutes = require('./routes/reportRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const leadRoutes = require('./routes/LeadRoutes');
const esqueletoRoutes = require('./routes/esqueletoRoutes');

const RMRoutes = require('./routes/RMRoutes');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/gastos', expenseRoutes);
app.use('/api/ingresos', incomeRoutes);
app.use('/api/planes-de-pago', paymentPlanRoutes);
app.use('/api/planes-entrenamiento', planEntrenamientoRoutes);
app.use('/api/servicios', serviceRoutes);
app.use('/api/entrenadores', trainerRoutes);
app.use('/api/transacciones', transactionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/plannings', planningRoutes);
app.use('/api/dietas', dietaRoutes);
app.use('/api/cuestionarios', cuestionarioRoutes);
app.use("/api/email-marketing", emailMarketingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/esqueleto', esqueletoRoutes);
app.use('/api/rms', RMRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.send('Bienvenidos a mi API perras');
});

// Middleware para manejar errores genéricos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocurrió un error en el servidor', error: err.message });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
