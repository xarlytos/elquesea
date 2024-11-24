const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Crear factura
router.post('/create', invoiceController.createInvoice);

// Registrar pago en factura
router.post('/record-payment', invoiceController.recordPayment);

// Enviar factura por email
router.post('/send-email', invoiceController.sendInvoiceByEmail);

module.exports = router;
