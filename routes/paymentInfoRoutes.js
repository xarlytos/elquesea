const express = require('express');
const router = express.Router();
const paymentInfoController = require('../controllers/paymentInfoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas para obtener información
router.get('/clients/:clientId/payments', [verificarToken], paymentInfoController.getClientPayments);
router.get('/clients/:clientId/subscriptions', [verificarToken], paymentInfoController.getClientSubscriptions);
router.get('/clients/:clientId/invoices', [verificarToken], paymentInfoController.getClientInvoices);
router.get('/clients/:clientId/subscriptions/:subscriptionId/upcoming-invoice', [verificarToken], paymentInfoController.getUpcomingInvoice);
router.get('/payments/:paymentId', [verificarToken], paymentInfoController.getPaymentDetails);
router.get('/revenue-summary', [verificarToken, verificarRol(['trainer'])], paymentInfoController.getRevenueSummary);

// Rutas para métodos de pago
router.post('/clients/:clientId/setup-intent', [verificarToken], paymentInfoController.createSetupIntent);

// Rutas para crear y gestionar suscripciones y facturas
router.post('/clients/:clientId/subscriptions', [verificarToken], paymentInfoController.createSubscription);
router.put('/subscriptions/:subscriptionId', [verificarToken], paymentInfoController.updateSubscription);
router.post('/clients/:clientId/invoices', [verificarToken], paymentInfoController.createInvoice);

// Rutas para suscripciones
router.get('/clients/:clientId/subscription/status', [verificarToken], paymentInfoController.getSubscriptionStatus);

// Rutas para productos y precios
router.post('/products', [verificarToken, verificarRol(['trainer'])], paymentInfoController.createProductWithPrice);
router.get('/products', [verificarToken], paymentInfoController.listProducts);

module.exports = router;
