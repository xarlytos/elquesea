const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

// Rutas públicas
router.post('/registro', [
    verificarToken,
    verificarRol(['trainer']),
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Agrega un email válido').isEmail(),
    check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 })
], clientController.registrarCliente);

// Rutas protegidas
router.use(verificarToken);

// Rutas que requieren rol de trainer
router.use(verificarRol(['trainer']));

// CRUD de clientes
router.get('/', clientController.obtenerClientes);
router.get('/:clientId', clientController.obtenerClientePorId);
router.put('/:clientId', clientController.actualizarCliente);
router.delete('/:clientId', clientController.eliminarCliente);

// Rutas para notas
router.post('/:clientId/notas', clientController.addNota);
router.get('/:clientId/notas', clientController.getNotas);
router.get('/:clientId/notas/:notaId', clientController.getNota);
router.put('/:clientId/notas/:notaId', clientController.updateNota);
router.delete('/:clientId/notas/:notaId', clientController.deleteNota);

// Rutas para plannings
router.post('/:clientId/plannings/:planningId', clientController.asignarPlanning);
router.put('/:clientId/plannings/:planningId/activar', clientController.establecerPlanningActivo);
router.get('/:clientId/plannings', clientController.obtenerPlanningsCliente);

// Rutas para dietas
router.post('/:clientId/dietas/:dietaId', clientController.asignarDieta);
router.put('/:clientId/dietas/:dietaId/activar', clientController.establecerDietaActiva);
router.get('/:clientId/dietas', clientController.obtenerDietasCliente);

module.exports = router;
