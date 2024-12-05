const express = require('express');
const router = express.Router();
const {
  getRoutines,
  getRoutine,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  duplicateRoutine
} = require('../controllers/routineController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Middleware de autenticación para todas las rutas
// router.use(verificarToken);

// Validaciones comunes para rutinas
// const routineValidations = [
//     check('name')
//         .notEmpty()
//         .withMessage('El nombre de la rutina es obligatorio')
//         .trim(),
//     check('exercises')
//         .isArray()
//         .withMessage('Los ejercicios deben ser un array')
//         .notEmpty()
//         .withMessage('Debe incluir al menos un ejercicio'),
//     check('exercises.*.name')
//         .notEmpty()
//         .withMessage('Cada ejercicio debe tener un nombre'),
//     check('exercises.*.metrics')
//         .isArray()
//         .withMessage('Las métricas deben ser un array')
//         .notEmpty()
//         .withMessage('Cada ejercicio debe tener al menos una métrica')
// ];

// Rutas públicas (solo para usuarios autenticados)
// router.get('/', routineController.getRoutines);
// router.get('/:id', routineController.getRoutine);
// router.post('/', routineValidations, routineController.createRoutine);
// router.put('/:id', routineValidations, routineController.updateRoutine);
// router.delete('/:id', routineController.deleteRoutine);
// router.post('/:id/duplicate', routineController.duplicateRoutine);

// Rutas para rutinas
router.post(
  '/routines',
  verificarToken,
  verificarRol(['trainer']),
  createRoutine
);

router.get(
  '/routines',
  verificarToken,
  verificarRol(['trainer']),
  getRoutines
);

router.get(
  '/routines/:id',
  verificarToken,
  verificarRol(['trainer']),
  getRoutine
);

router.put(
  '/routines/:id',
  verificarToken,
  verificarRol(['trainer']),
  updateRoutine
);

router.delete(
  '/routines/:id',
  verificarToken,
  verificarRol(['trainer']),
  deleteRoutine
);

// Ruta para duplicar rutina
router.post(
  '/routines/:id/duplicate',
  verificarToken,
  verificarRol(['trainer']),
  duplicateRoutine
);

// Ruta para obtener todas las rutinas (admin)
router.get(
  '/admin/routines',
  verificarToken,
  verificarRol(['admin']),
  async (req, res) => {
    try {
      const routines = await Routine.find();
      res.status(200).json({
        status: 'success',
        data: routines
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error al obtener todas las rutinas'
      });
    }
  }
);

module.exports = router;
