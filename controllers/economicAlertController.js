const EconomicAlert = require('../models/economicAlertModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear una nueva alerta económica
exports.createAlert = catchAsync(async (req, res, next) => {
    // Asignar el trainer automáticamente
    req.body.trainer = req.user.id;
    
    const newAlert = await EconomicAlert.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: {
            alert: newAlert
        }
    });
});

// Obtener todas las alertas
exports.getAllAlerts = catchAsync(async (req, res, next) => {
    let query = EconomicAlert.find();
    
    // Si es un trainer, solo ver sus alertas
    if (req.user.rol === 'trainer') {
        query = query.find({ trainer: req.user.id });
    }
    
    // Populate referencias
    query = query.populate('trainer', 'nombre email')
                .populate('contrato', 'nombre fechaInicio fechaFin')
                .populate('licencia', 'nombre fechaExpiracion')
                .populate('otroDocumento', 'nombre tipo');
    
    const alerts = await query;
    
    res.status(200).json({
        status: 'success',
        results: alerts.length,
        data: {
            alerts
        }
    });
});

// Obtener alertas próximas a vencer
exports.getUpcomingAlerts = catchAsync(async (req, res, next) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const alerts = await EconomicAlert.find({
        fechaExpiracion: { $gte: now, $lte: sevenDaysFromNow },
        estado: 'Activa'
    }).populate('trainer contrato licencia otroDocumento');
    
    res.status(200).json({
        status: 'success',
        results: alerts.length,
        data: {
            alerts
        }
    });
});

// Obtener una alerta específica
exports.getAlert = catchAsync(async (req, res, next) => {
    const alert = await EconomicAlert.findById(req.params.id)
        .populate('trainer contrato licencia otroDocumento');

    if (!alert) {
        return next(new AppError('No se encontró la alerta con ese ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            alert
        }
    });
});

// Actualizar una alerta
exports.updateAlert = catchAsync(async (req, res, next) => {
    const alert = await EconomicAlert.findById(req.params.id);

    if (!alert) {
        return next(new AppError('No se encontró la alerta con ese ID', 404));
    }

    // Verificar que el trainer sea el propietario
    if (alert.trainer && alert.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para modificar esta alerta', 403));
    }

    const updatedAlert = await EconomicAlert.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate('trainer contrato licencia otroDocumento');

    res.status(200).json({
        status: 'success',
        data: {
            alert: updatedAlert
        }
    });
});

// Eliminar una alerta
exports.deleteAlert = catchAsync(async (req, res, next) => {
    const alert = await EconomicAlert.findById(req.params.id);

    if (!alert) {
        return next(new AppError('No se encontró la alerta con ese ID', 404));
    }

    // Verificar que el trainer sea el propietario
    if (alert.trainer && alert.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para eliminar esta alerta', 403));
    }

    await EconomicAlert.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
