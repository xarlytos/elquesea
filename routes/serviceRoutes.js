// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createService,
  createPaymentPlan,
  associateClientToPaymentPlan,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  getAllPaymentPlans,
  getPaymentPlanById,
  updatePaymentPlan,
  deletePaymentPlan,
  getClientsByPaymentPlan,
  disassociateClientFromPaymentPlan,
  getServicesByType,
} = require('../controllers/serviceController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Rutas para servicios
router.post(
  '/services',
  verificarToken,
  verificarRol(['trainer']),
  createService
);

router.get(
  '/services',
  verificarToken,
  verificarRol(['trainer']),
  getAllServices
);

router.get(
  '/services/:serviceId',
  verificarToken,
  verificarRol(['trainer']),
  getServiceById
);

router.put(
  '/services/:serviceId',
  verificarToken,
  verificarRol(['trainer']),
  updateService
);

router.delete(
  '/services/:serviceId',
  verificarToken,
  verificarRol(['trainer']),
  deleteService
);

// Rutas para planes de pago
router.post(
  '/paymentplans',
  verificarToken,
  verificarRol(['trainer']),
  createPaymentPlan
);

router.get(
  '/paymentplans',
  verificarToken,
  verificarRol(['trainer']),
  getAllPaymentPlans
);

router.get(
  '/paymentplans/:paymentPlanId',
  verificarToken,
  verificarRol(['trainer']),
  getPaymentPlanById
);

router.put(
  '/paymentplans/:paymentPlanId',
  verificarToken,
  verificarRol(['trainer']),
  updatePaymentPlan
);

router.delete(
  '/paymentplans/:paymentPlanId',
  verificarToken,
  verificarRol(['trainer']),
  deletePaymentPlan
);

// Rutas para asociar y desasociar clientes a planes de pago
router.post(
  '/paymentplans/:paymentPlanId/associate',
  verificarToken,
  verificarRol(['trainer']),
  associateClientToPaymentPlan
);

router.post(
  '/paymentplans/:paymentPlanId/disassociate',
  verificarToken,
  verificarRol(['trainer']),
  disassociateClientFromPaymentPlan
);

// Ruta para obtener los clientes asociados a un plan de pago
router.get(
  '/paymentplans/:paymentPlanId/clients',
  verificarToken,
  verificarRol(['trainer']),
  getClientsByPaymentPlan
);

// Rutas para obtener servicios por tipo
router.get(
  '/services/tipo/Suscripción',
  verificarToken,
  verificarRol(['trainer']),
  (req, res) => {
    req.params.tipo = 'Suscripción';
    getServicesByType(req, res);
  }
);

router.get(
  '/services/tipo/Asesoría Individual',
  verificarToken,
  verificarRol(['trainer']),
  (req, res) => {
    req.params.tipo = 'Asesoría Individual';
    getServicesByType(req, res);
  }
);

router.get(
  '/services/tipo/ClaseGrupal',
  verificarToken,
  verificarRol(['trainer']),
  (req, res) => {
    req.params.tipo = 'Clase Grupal';
    getServicesByType(req, res);
  }
);

router.get(
  '/services/tipo/Pack de Citas',
  verificarToken,
  verificarRol(['trainer']),
  (req, res) => {
    req.params.tipo = 'Pack de Citas';
    getServicesByType(req, res);
  }
);

// Opción alternativa: Ruta genérica para obtener servicios por tipo
router.get(
  '/services/tipo/:tipo',
  verificarToken,
  verificarRol(['trainer']),
  getServicesByType
);
module.exports = router;
