const Bono = require('../models/bonoModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear un nuevo bono
exports.createBono = catchAsync(async (req, res, next) => {
    // Asignar el trainer automáticamente
    req.body.trainer = req.user.id;
    
    const newBono = await Bono.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: {
            bono: newBono
        }
    });
});

// Obtener todos los bonos
exports.getAllBonos = catchAsync(async (req, res, next) => {
    let query = Bono.find();
    
    // Si es un trainer, solo ver sus bonos
    if (req.user.rol === 'trainer') {
        query = query.find({ trainer: req.user.id });
    }
    // Si es un cliente, solo ver sus bonos
    if (req.user.rol === 'client') {
        query = query.find({ clienteId: req.user.id });
    }
    
    // Populate referencias
    query = query.populate('trainer', 'nombre email')
                .populate('clienteId', 'nombre email');
    
    const bonos = await query;
    
    res.status(200).json({
        status: 'success',
        results: bonos.length,
        data: {
            bonos
        }
    });
});

// Obtener un bono específico
exports.getBono = catchAsync(async (req, res, next) => {
    const bono = await Bono.findById(req.params.id)
        .populate('trainer', 'nombre email')
        .populate('clienteId', 'nombre email');

    if (!bono) {
        return next(new AppError('No se encontró el bono con ese ID', 404));
    }

    // Verificar acceso
    if (req.user.rol === 'client' && bono.clienteId.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para ver este bono', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            bono
        }
    });
});

// Actualizar un bono
exports.updateBono = catchAsync(async (req, res, next) => {
    const bono = await Bono.findById(req.params.id);

    if (!bono) {
        return next(new AppError('No se encontró el bono con ese ID', 404));
    }

    // Solo el trainer asignado puede modificar el bono
    if (bono.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para modificar este bono', 403));
    }

    const updatedBono = await Bono.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate('trainer clienteId');

    res.status(200).json({
        status: 'success',
        data: {
            bono: updatedBono
        }
    });
});

// Eliminar un bono
exports.deleteBono = catchAsync(async (req, res, next) => {
    const bono = await Bono.findById(req.params.id);

    if (!bono) {
        return next(new AppError('No se encontró el bono con ese ID', 404));
    }

    // Solo el trainer asignado puede eliminar el bono
    if (bono.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para eliminar este bono', 403));
    }

    await Bono.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Usar una sesión del bono
exports.usarSesion = catchAsync(async (req, res, next) => {
    const bono = await Bono.findById(req.params.id);

    if (!bono) {
        return next(new AppError('No se encontró el bono con ese ID', 404));
    }

    if (bono.estado !== 'activo') {
        return next(new AppError('Este bono no está activo', 400));
    }

    if (bono.sesionesRestantes <= 0) {
        return next(new AppError('No quedan sesiones disponibles en este bono', 400));
    }

    bono.sesionesRestantes -= 1;
    if (bono.sesionesRestantes === 0) {
        bono.estado = 'usado';
    }

    await bono.save();

    res.status(200).json({
        status: 'success',
        data: {
            bono
        }
    });
});
