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

// Rutas para gestionar la información personal del cliente
router.get(
  '/:clientId/informacion-personal',
  [verificarToken, verificarRol(['trainer'])],
  clientController.obtenerInformacionPersonal
);

router.put(
  '/:clientId/info-basica',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('nombre', 'El nombre es opcional').optional(),
    check('email', 'Agrega un email válido').optional().isEmail(),
    check('fechaNacimiento', 'La fecha de nacimiento debe ser válida').optional().isISO8601(),
    check('genero', 'El género debe ser válido').optional().isIn(['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo']),
    check('telefono', 'El teléfono es opcional').optional()
  ],
  clientController.actualizarInformacionBasica
);

router.put(
  '/:clientId/info-fisiologica',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('altura', 'La altura debe ser un número válido').optional().isFloat({ min: 0, max: 300 }),
    check('peso', 'El peso debe ser un número válido').optional().isFloat({ min: 0, max: 500 }),
    check('condicionesMedicas', 'Las condiciones médicas deben ser un array').optional().isArray()
  ],
  clientController.actualizarInfoFisiologica
);

router.put(
  '/:clientId/contacto',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('direccion', 'La dirección debe ser un objeto válido').optional().isObject(),
    check('direccion.calle', 'La calle es requerida si se proporciona dirección').if(check('direccion').exists()).notEmpty(),
    check('direccion.ciudad', 'La ciudad es requerida si se proporciona dirección').if(check('direccion').exists()).notEmpty(),
    check('direccion.provincia', 'La provincia es requerida si se proporciona dirección').if(check('direccion').exists()).notEmpty(),
    check('redesSociales', 'Las redes sociales deben ser un array').optional().isArray(),
    check('redesSociales.*.platform', 'La plataforma debe ser válida').optional().isIn(['instagram', 'facebook', 'twitter']),
    check('redesSociales.*.username', 'El nombre de usuario es requerido').optional().notEmpty()
  ],
  clientController.actualizarContacto
);

router.put(
  '/:clientId/tags',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('tags', 'Los tags deben ser un array').isArray(),
    check('tags.*.name', 'El nombre del tag es requerido').notEmpty(),
    check('tags.*.color', 'El color del tag es requerido').notEmpty()
  ],
  clientController.gestionarTags
);

router.put(
  '/:clientId/info-fisica',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('altura', 'La altura debe ser un número válido').optional().isNumeric(),
    check('peso', 'El peso debe ser un número válido').optional().isNumeric()
  ],
  clientController.actualizarInformacionFisica
);

router.put(
  '/:clientId/condiciones-medicas',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('condicionesMedicas', 'Las condiciones médicas deben ser un array').isArray()
  ],
  clientController.gestionarCondicionesMedicas
);

router.put(
  '/:clientId/redes-sociales',
  [
    verificarToken,
    verificarRol(['trainer']),
    check('redesSociales', 'Las redes sociales deben ser un array').isArray()
  ],
  clientController.gestionarRedesSociales
);

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
