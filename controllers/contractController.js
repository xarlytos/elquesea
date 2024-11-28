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
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
        return next(new AppError('No se encontró el contrato con ese ID', 404));
    }

    // Solo el trainer asignado puede modificar el contrato
    if (contract.trainer.toString() !== req.user.id) {
        return next(new AppError('Solo el trainer asignado puede modificar este contrato', 403));
    }

    // Evitar cambiar el trainer o cliente asignado
    delete req.body.trainer;
    delete req.body.cliente;

    const updatedContract = await Contract.findByIdAndUpdate(
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
            contract: updatedContract
        }
    });
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
