const Contract = require('../models/contractModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Crear un nuevo contrato
exports.createContract = catchAsync(async (req, res, next) => {
    // Asegurarse de que el trainer que crea el contrato es el mismo que se asigna
    req.body.trainer = req.user.id;
    
    const newContract = await Contract.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: {
            contract: newContract
        }
    });
});

// Obtener todos los contratos
exports.getAllContracts = catchAsync(async (req, res, next) => {
    let query = Contract.find();
    
    // Si es un cliente, solo ver sus contratos
    if (req.user.rol === 'client') {
        query = query.find({ cliente: req.user.id });
    }
    
    // Populate referencias
    query = query.populate('cliente', 'nombre email')
                .populate('trainer', 'nombre email');
    
    const contracts = await query;
    
    res.status(200).json({
        status: 'success',
        results: contracts.length,
        data: {
            contracts
        }
    });
});

// Obtener un contrato específico
exports.getContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.id)
        .populate('cliente', 'nombre email')
        .populate('trainer', 'nombre email');

    if (!contract) {
        return next(new AppError('No se encontró el contrato con ese ID', 404));
    }

    // Verificar acceso
    if (req.user.rol === 'client' && contract.cliente.toString() !== req.user.id) {
        return next(new AppError('No tienes permiso para ver este contrato', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            contract
        }
    });
});

// Actualizar un contrato
exports.updateContract = catchAsync(async (req, res, next) => {
    console.log('🚀 Iniciando actualización de contrato...');
    console.log('📋 Datos recibidos:', {
        id: req.params.id,
        actualizaciones: req.body
    });

    // Buscar el contrato existente
    console.log('🔍 Buscando contrato existente...');
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
        console.log('❌ Contrato no encontrado');
        return next(new AppError('No se encontró el contrato con ese ID', 404));
    }

    console.log('✅ Contrato encontrado:', {
        id: contract._id,
        nombre: contract.nombre,
        estado: contract.estado,
        fechaActualInicio: contract.fechaInicio,
        fechaActualFin: contract.fechaFin
    });

    // Verificar permisos
    const isTrainerOwner = req.user.rol === 'trainer';
    const isTrainerCreator = contract.trainer.toString() === req.user.id;

    if (!isTrainerOwner && !isTrainerCreator) {
        console.log('🚫 Acceso denegado:', {
            rolUsuario: req.user.rol,
            idUsuario: req.user.id,
            idTrainerContrato: contract.trainer.toString()
        });
        return next(new AppError('No tienes permiso para actualizar este contrato', 403));
    }

    try {
        // Actualizar el contrato
        console.log('📝 Aplicando actualizaciones al contrato...');
        const updatedContract = await Contract.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('cliente', 'nombre email')
         .populate('trainer', 'nombre email');

        if (!updatedContract) {
            throw new Error('Error al actualizar el contrato');
        }

        console.log('✨ Contrato actualizado exitosamente:', {
            id: updatedContract._id,
            nombre: updatedContract.nombre,
            estado: updatedContract.estado,
            fechaInicio: updatedContract.fechaInicio,
            fechaFin: updatedContract.fechaFin
        });

        res.status(200).json({
            status: 'success',
            data: {
                contract: updatedContract
            }
        });
    } catch (error) {
        console.log('❌ Error al actualizar el contrato:', {
            mensaje: error.message,
            tipo: error.name
        });
        return next(new AppError(error.message, 400));
    }
});

// Eliminar un contrato
exports.deleteContract = catchAsync(async (req, res, next) => {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
        return next(new AppError('No se encontró el contrato con ese ID', 404));
    }

    // Solo el trainer asignado puede eliminar el contrato
    if (contract.trainer.toString() !== req.user.id) {
        return next(new AppError('Solo el trainer asignado puede eliminar este contrato', 403));
    }

    await Contract.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Obtener estadísticas de contratos
exports.getContractStats = catchAsync(async (req, res, next) => {
    const stats = await Contract.aggregate([
        {
            $match: { 
                trainer: req.user.rol === 'trainer' ? req.user.id : { $exists: true }
            }
        },
        {
            $group: {
                _id: '$estado',
                numContratos: { $sum: 1 },
                montoTotal: { $sum: '$montoTotal' }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});
