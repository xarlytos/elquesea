// routes/invoiceRoutes.js

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarse de que la carpeta 'uploads/documentosAdicionales/' exista
const uploadDir = path.join(__dirname, '../uploads/documentosAdicionales/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Creada la carpeta de uploads: ${uploadDir}`);
}

// Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo ciertos tipos de archivos (PDF, PNG, JPG)
  const allowedTypes = /pdf|png|jpg|jpeg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, PNG y JPG.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Rutas protegidas con autenticación y autorización
// Crear una factura (solo entrenadores)
router.post(
  '/',
  verificarToken,
  verificarRol('trainer'), // Asegúrate de que el rol 'trainer' exista
  upload.array('documentosAdicionales', 10), // Hasta 10 archivos
  invoiceController.createInvoice
);

// Obtener todas las facturas (acceso restringido según roles)
router.get(
  '/',
  verificarToken,
  // verificarRol(['admin', 'trainer', 'client']), // Descomenta y ajusta según tus necesidades
  invoiceController.getAllInvoices
);

// Obtener una factura por ID
router.get(
  '/:id',
  verificarToken,
  // verificarRol(['admin', 'trainer', 'client']), // Descomenta y ajusta según tus necesidades
  invoiceController.getInvoiceById
);

// Generar PDF de la factura
router.get(
  '/:id/pdf',
  verificarToken,
  verificarRol(['admin', 'trainer', 'client']),
  invoiceController.generateInvoicePDF
);

// Actualizar una factura (solo entrenadores o admins)
router.put(
  '/:id',
  verificarToken,
  verificarRol(['trainer', 'admin']), // Ajusta los roles según tus necesidades
  upload.array('documentosAdicionales', 10), // Opcional: para actualizar documentos
  invoiceController.updateInvoice
);

// Eliminar una factura (solo admins)
router.delete(
  '/:id',
  verificarToken,
  verificarRol('trainer'), // Solo admins pueden eliminar
  invoiceController.deleteInvoice
);

// Registrar un pago para una factura
router.post(
  '/record-payment',
  verificarToken,
  verificarRol(['admin', 'trainer']), // Ajusta los roles según tus necesidades
  invoiceController.recordPayment
);

// Enviar factura por correo electrónico
router.post(
  '/send-email',
  verificarToken,
  verificarRol(['admin', 'trainer']), // Ajusta los roles según tus necesidades
  invoiceController.sendInvoiceByEmail
);

module.exports = router;
