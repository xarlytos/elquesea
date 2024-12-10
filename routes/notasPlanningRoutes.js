const express = require('express');
const router = express.Router();
const notasPlanningController = require('../controllers/notasPlanningController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');
const validarCampos = require('../middlewares/validarCampos');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Crear una nueva nota
router.post('/',
    [
        verificarRol(['admin', 'trainer']),
        check('planningId', 'El ID del planning es obligatorio').isMongoId(),
        check('titulo', 'El título es obligatorio').notEmpty(),
        check('contenido', 'El contenido es obligatorio').notEmpty(),
        check('importante', 'El campo importante debe ser un booleano').optional().isBoolean(),
        validarCampos
    ],
    notasPlanningController.crearNota
);

// Obtener todas las notas de un planning específico
router.get('/planning/:planningId',
    [
        verificarRol(['admin', 'trainer', 'client']),
        check('planningId', 'El ID del planning no es válido').isMongoId(),
        validarCampos
    ],
    notasPlanningController.obtenerNotasPorPlanning
);

// Obtener una nota específica
router.get('/:id',
    [
        verificarRol(['admin', 'trainer', 'client']),
        check('id', 'El ID de la nota no es válido').isMongoId(),
        validarCampos
    ],
    notasPlanningController.obtenerNota
);

// Actualizar una nota
router.put('/:id',
    [
        verificarRol(['admin', 'trainer']),
        check('id', 'El ID de la nota no es válido').isMongoId(),
        check('titulo', 'El título es obligatorio').optional().notEmpty(),
        check('contenido', 'El contenido es obligatorio').optional().notEmpty(),
        check('importante', 'El campo importante debe ser un booleano').optional().isBoolean(),
        validarCampos
    ],
    notasPlanningController.actualizarNota
);

// Eliminar una nota
router.delete('/:id',
    [
        verificarRol(['admin', 'trainer']),
        check('id', 'El ID de la nota no es válido').isMongoId(),
        validarCampos
    ],
    notasPlanningController.eliminarNota
);

module.exports = router;
