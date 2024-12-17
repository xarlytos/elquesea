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
    console.log('🚀 Iniciando actualización de documento...');
    console.log('📋 Datos recibidos:', {
        id: req.params.id,
        actualizaciones: req.body
    });

    // Buscar el documento existente
    console.log('🔍 Buscando documento existente...');
    const documento = await OtrosDocumentos.findById(req.params.id);

    if (!documento) {
        console.log('❌ Documento no encontrado');
        return next(new AppError('No se encontró el documento con ese ID', 404));
    }

    console.log('✅ Documento encontrado:', {
        id: documento._id,
        nombre: documento.nombre,
        tipo: documento.tipo
    });

    // Verificar permisos
    const isTrainerOwner = documento.trainer.toString() === req.user.id;

    if (!isTrainerOwner) {
        console.log('🚫 Acceso denegado:', {
            idUsuario: req.user.id,
            idTrainerDocumento: documento.trainer.toString()
        });
        return next(new AppError('No tienes permiso para actualizar este documento', 403));
    }

    try {
        // Actualizar el documento
        console.log('📝 Aplicando actualizaciones al documento...');
        const updatedDocumento = await OtrosDocumentos.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('trainer', 'nombre email');

        if (!updatedDocumento) {
            throw new Error('Error al actualizar el documento');
        }

        console.log('✨ Documento actualizado exitosamente:', {
            id: updatedDocumento._id,
            nombre: updatedDocumento.nombre,
            tipo: updatedDocumento.tipo,
            fechaActualizacion: updatedDocumento.updatedAt
        });

        res.status(200).json({
            status: 'success',
            data: {
                documento: updatedDocumento
            }
        });
    } catch (error) {
        console.log('❌ Error al actualizar el documento:', {
            mensaje: error.message,
            tipo: error.name
        });
        return next(new AppError(error.message, 400));
    }
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
