const Reporte = require('../models/Reporte'); // Cambiado el path del modelo
const { generateTicketId } = require('../utils/helpers');
const Trainer = require('../models/Trainer');

exports.crearReporte = async (req, res) => {
    try {
        console.log('1. Iniciando creación de reporte');
        console.log('1.1. Request body:', req.body);
        console.log('1.2. Request user:', req.user);

        const trainerId = req.user._id;
        console.log('2. ID del trainer:', trainerId);

        // Generar ID del ticket
        const ticketId = await generateTicketId();
        console.log('3. Ticket ID generado:', ticketId);

        const reporteData = {
            ...req.body,
            trainer: trainerId,
            idTicket: `TK-${ticketId}`,
            fechaRecibido: new Date(),
            ultimaActualizacion: new Date()
        };
        console.log('4. Datos del reporte a crear:', reporteData);

        const reporte = await Reporte.create(reporteData);
        console.log('5. Reporte creado:', reporte);

        res.status(201).json({
            status: 'success',
            data: reporte
        });
    } catch (error) {
        console.error('ERROR en crearReporte:', error);
        console.error('Detalles del error:', {
            mensaje: error.message,
            nombre: error.name,
            stack: error.stack
        });
        
        res.status(400).json({
            status: 'error',
            message: error.message,
            detalles: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.obtenerReportes = async (req, res) => {
    try {
        const trainerId = req.user._id; // Obtenido del token
        const reportes = await Reporte.find({ trainer: trainerId })
            .sort({ fechaRecibido: -1 });

        res.status(200).json({
            status: 'success',
            data: reportes
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.actualizarReporte = async (req, res) => {
    try {
        const trainerId = req.user._id;
        const { id } = req.params;

        const reporte = await Reporte.findOne({ _id: id, trainer: trainerId });
        if (!reporte) {
            return res.status(404).json({
                status: 'error',
                message: 'Reporte no encontrado'
            });
        }

        const reporteActualizado = await Reporte.findByIdAndUpdate(
            id,
            { ...req.body, ultimaActualizacion: new Date() },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: reporteActualizado
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.eliminarReporte = async (req, res) => {
    try {
        const trainerId = req.user._id;
        const { id } = req.params;

        const reporte = await Reporte.findOneAndDelete({ _id: id, trainer: trainerId });
        
        if (!reporte) {
            return res.status(404).json({
                status: 'error',
                message: 'Reporte no encontrado'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Reporte eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.obtenerReportePorId = async (req, res) => {
    try {
        const trainerId = req.user._id;
        const { id } = req.params;

        const reporte = await Reporte.findOne({ _id: id, trainer: trainerId });
        
        if (!reporte) {
            return res.status(404).json({
                status: 'error',
                message: 'Reporte no encontrado'
            });
        }

        res.status(200).json({
            status: 'success',
            data: reporte
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
