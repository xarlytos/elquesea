const License = require('../models/licenseModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear una nueva licencia
exports.createLicense = catchAsync(async (req, res, next) => {
    const newLicense = await License.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            license: newLicense
        }
    });
});

// Obtener todas las licencias
exports.getAllLicenses = catchAsync(async (req, res, next) => {
    const licenses = await License.find();
    res.status(200).json({
        status: 'success',
        results: licenses.length,
        data: {
            licenses
        }
    });
});

// Obtener una licencia específica
exports.getLicense = catchAsync(async (req, res, next) => {
    const license = await License.findById(req.params.id);
    if (!license) {
        return next(new AppError('No se encontró la licencia con ese ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            license
        }
    });
});

// Actualizar una licencia
exports.updateLicense = catchAsync(async (req, res, next) => {
    const license = await License.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!license) {
        return next(new AppError('No se encontró la licencia con ese ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            license
        }
    });
});

// Eliminar una licencia
exports.deleteLicense = catchAsync(async (req, res, next) => {
    const license = await License.findByIdAndDelete(req.params.id);
    if (!license) {
        return next(new AppError('No se encontró la licencia con ese ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});
