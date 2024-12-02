const Reporte = require('../models/Reporte');

exports.generateTicketId = async () => {
    // Obtener el último reporte
    const lastReporte = await Reporte.findOne({}, {}, { sort: { 'createdAt': -1 } });
    
    if (!lastReporte) {
        return '1000'; // Comenzar desde 1000 si no hay reportes
    }

    // Extraer el número del último idTicket (formato: TK-XXXX)
    const lastNumber = parseInt(lastReporte.idTicket.split('-')[1]);
    
    // Incrementar el número y convertirlo a string con padding
    return (lastNumber + 1).toString();
};
