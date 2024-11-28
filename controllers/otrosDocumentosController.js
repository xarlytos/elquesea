const OtrosDocumentos = require('../models/otrosDocumentosModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear un nuevo documento
exports.createDocumento = catchAsync(async (req, res, next) => {
    // Asignar el trainer automáticamente
    req.body.trainer = req.user.id;
    
    const newDocumento = await OtrosDocumentos.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: {
            documento: newDocumento
        }
    });
});

// Obtener todos los documentos
exports.getAllDocumentos = catchAsync(async (req, res, next) => {
    let query = OtrosDocumentos.find();
    
    // Si es un trainer, solo ver sus documentos
    if (req.user.rol === 'trainer') {
        query = query.find({ trainer: req.user.id });
    }
    
    const documentos = await query.populate('trainer', 'nombre email');
    
    res.status(200).json({
        status: 'success',
        results: documentos.length,
        data: {
            documentos
        }
    });
});

// Obtener un documento específico
exports.getDocumento = catchAsync(async (req, res, next) => {
    const documento = await OtrosDocumentos.findById(req.params.id)
        .populate('trainer', 'nombre email');

    if (!documento) {
        return next(new AppError('No se encontró el documento con ese ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            documento
        }
    });
});

// Actualizar un documento
exports.updateDocumento = catchAsync(async (req, res, next) => {
    const documento = await OtrosDocumentos.findById(req.params.id);

    if (!documento) {
        return next(new AppError('No se encontró el documento con ese ID', 404));
    }

    // Verificar que el trainer sea el propietario
    if (documento.trainer && documento.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para modificar este documento', 403));
    }

    const updatedDocumento = await OtrosDocumentos.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            documento: updatedDocumento
        }
    });
});

// Eliminar un documento
exports.deleteDocumento = catchAsync(async (req, res, next) => {
    const documento = await OtrosDocumentos.findById(req.params.id);

    if (!documento) {
        return next(new AppError('No se encontró el documento con ese ID', 404));
    }

    // Verificar que el trainer sea el propietario
    if (documento.trainer && documento.trainer.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para eliminar este documento', 403));
    }

    await OtrosDocumentos.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
