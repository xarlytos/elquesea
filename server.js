const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Configuración específica de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'https://crmactualizado-f9oy.vercel.app'],
  credentials: true,
};

// Configuración de los puertos y la URI de MongoDB
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://xarlytos:NxRCGi5eCbxNKj31@xarlytos.c7diz.mongodb.net/usersddb?retryWrites=true&w=majority&appName=xarlytos";

// Crear una instancia de la aplicación de Express
const app = express();

// Middleware para habilitar CORS con opciones específicas
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware para leer JSON en las solicitudes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Opciones de conexión para Mongoose
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Conexión a MongoDB usando Mongoose
console.log('Intentando conectar a MongoDB...');
mongoose.connect(MONGODB_URI, options)
.then(() => console.log(' Conectado exitosamente a MongoDB Atlas'))
.catch(err => {
    console.error(' Error de conexión a MongoDB:', err);
    process.exit(1);
});

// Importar las rutas
try {
    const authRoutes = require('./routes/authRoutes');
    const clientRoutes = require('./routes/clientRoutes');
    const expenseRoutes = require('./routes/expenseRoutes');
    const incomeRoutes = require('./routes/incomeRoutes');
    const paymentPlanRoutes = require('./routes/paymentPlanRoutes');
    const paymentInfoRoutes = require('./routes/paymentInfoRoutes');
    const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
    const planEntrenamientoRoutes = require('./routes/planEntrenamientoRoutes');
    const serviceRoutes = require('./routes/serviceRoutes');
    const trainerRoutes = require('./routes/trainerRoutes');
    const transactionRoutes = require('./routes/transactionRoutes');
    const planningRoutes = require('./routes/planningRoutes');
    const dietaRoutes = require('./routes/dietas');
    const cuestionarioRoutes = require('./routes/cuestionarioRoutes');
    const emailMarketingRoutes = require('./routes/emailMarketingRoutes');
    const reportRoutes = require('./routes/reportRoutes');
    const invoiceRoutes = require('./routes/invoiceRoutes');
    const leadRoutes = require('./routes/LeadRoutes');
    const esqueletoRoutes = require('./routes/esqueletoRoutes');
    const RMRoutes = require('./routes/RMRoutes');
    const eventRoutes = require('./routes/eventRoutes');
    const licenseRoutes = require('./routes/licenseRoutes');
    const contractRoutes = require('./routes/contractRoutes');
    const otrosDocumentosRoutes = require('./routes/otrosDocumentosRoutes');
    const economicAlertRoutes = require('./routes/economicAlertRoutes');
    const bonoRoutes = require('./routes/bonoRoutes');
    const reporteRoutes = require('./routes/reporteRoutes');
    const exerciseRoutes = require('./routes/exerciseRoutes');
    const routineRoutes = require('./routes/routineRoutes');
    const planningTemplateRoutes = require('./routes/planningTemplateRoutes');
    const messageRoutes = require('./routes/messageRoutes');
    const trainerClientChatRoutes = require('./routes/trainerClientChatRoutes');
    const notasPlanningRoutes = require('./routes/notasPlanningRoutes');
    // Configurar rutas
    app.use('/api/auth', authRoutes);
    app.use('/api/clientes', clientRoutes);
    app.use('/api/licenses', licenseRoutes);
    app.use('/api/gastos', expenseRoutes);
    app.use('/api/ingresos', incomeRoutes);
    app.use('/api/planes-de-pago', paymentPlanRoutes);
    app.use('/api/payment-info', paymentInfoRoutes);
    app.use('/api/metodos-de-pago', paymentMethodRoutes);
    app.use('/api/planes-entrenamiento', planEntrenamientoRoutes);
    app.use('/api/servicios', serviceRoutes);
    app.use('/api/entrenadores', trainerRoutes);
    app.use('/api/transacciones', transactionRoutes);
    app.use('/api/plannings', planningRoutes);
    app.use('/api/exercises', exerciseRoutes);
    app.use('/api/routines', routineRoutes);
    app.use('/api/dietas', dietaRoutes);
    app.use('/api/cuestionarios', cuestionarioRoutes);
    app.use('/api/email-marketing', emailMarketingRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/invoice', invoiceRoutes);
    app.use('/api/leads', leadRoutes);
    app.use('/api/esqueleto', esqueletoRoutes);
    app.use('/api/rms', RMRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/contracts', contractRoutes);
    app.use('/api/otros-documentos', otrosDocumentosRoutes);
    app.use('/api/economic-alerts', economicAlertRoutes);
    app.use('/api/bonos', bonoRoutes);
    app.use('/api/reportes', reporteRoutes);
    app.use('/api', messageRoutes); // Montamos las rutas de mensajes en /api
    app.use('/api', trainerClientChatRoutes); // Montamos las rutas de chat en /api
    app.use('/api/planningtemplate', planningTemplateRoutes);
    app.use('/api/notas-planning', notasPlanningRoutes);
    console.log(' Todas las rutas configuradas correctamente');
} catch (error) {
    console.error(' Error al cargar las rutas:', error);
    process.exit(1);
}

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API REST funcionando correctamente',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(' Error en el servidor:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`
=== SERVIDOR INICIADO ===
 Puerto: ${PORT}
 Modo: ${process.env.NODE_ENV || 'development'}
 Fecha: ${new Date().toISOString()}
  `);
});
