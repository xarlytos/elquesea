const express = require('express');
const router = express.Router();
const paymentMethodService = require('../controllers/services/paymentMethodService');
const { verificarToken } = require('../middlewares/authMiddleware');

// Configurar un método de pago para un cliente
router.post('/:clientId/setup', verificarToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { paymentMethodId } = req.body;

        const result = await paymentMethodService.setupCustomer(clientId, paymentMethodId);
        res.json(result);
    } catch (error) {
        console.error('Error al configurar método de pago:', error);
        res.status(500).json({ 
            error: 'Error al configurar método de pago',
            details: error.message 
        });
    }
});

// Obtener métodos de pago de un cliente
router.get('/:clientId', verificarToken, async (req, res) => {
    try {
        const { clientId } = req.params;
        const paymentMethods = await paymentMethodService.getPaymentMethods(clientId);
        res.json(paymentMethods);
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({ 
            error: 'Error al obtener métodos de pago',
            details: error.message 
        });
    }
});

// Eliminar un método de pago
router.delete('/:clientId/:paymentMethodId', verificarToken, async (req, res) => {
    try {
        const { clientId, paymentMethodId } = req.params;
        const result = await paymentMethodService.removePaymentMethod(clientId, paymentMethodId);
        res.json(result);
    } catch (error) {
        console.error('Error al eliminar método de pago:', error);
        res.status(500).json({ 
            error: 'Error al eliminar método de pago',
            details: error.message 
        });
    }
});

module.exports = router;
