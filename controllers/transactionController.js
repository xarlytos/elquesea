const Transaction = require('../models/Transaction');
const PaymentPlan = require('../models/PaymentPlan');

// Obtener todas las transacciones
exports.obtenerTransacciones = async (req, res) => {
  try {
    const transacciones = await Transaction.find().populate('cliente planDePago');
    res.status(200).json(transacciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las transacciones' });
  }
};

// Obtener una transacción por ID
exports.obtenerTransaccionPorId = async (req, res) => {
  try {
    const transaccion = await Transaction.findById(req.params.id).populate('cliente planDePago');
    if (!transaccion) return res.status(404).json({ message: 'Transacción no encontrada' });
    res.status(200).json(transaccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la transacción' });
  }
};

// Registrar una transacción (ejemplo, en caso de usar sin Stripe)
exports.crearTransaccion = async (req, res) => {
  try {
    const { clienteId, planDePagoId, monto, moneda, frecuenciaPago, estado } = req.body;
    
    const nuevaTransaccion = await Transaction.create({
      cliente: clienteId,
      planDePago: planDePagoId,
      monto,
      moneda,
      frecuenciaPago,
      estado,
    });

    res.status(201).json(nuevaTransaccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la transacción' });
  }
};
