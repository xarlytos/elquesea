const stripeService = require('./services/stripeService');
const Client = require('../models/Client');

const paymentInfoController = {
    // Obtener todos los pagos de un cliente
    async getClientPayments(req, res) {
        try {
            const client = await Client.findById(req.params.clientId);
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            // Crear o recuperar cliente en Stripe si es necesario
            const stripeCustomer = await stripeService.createOrRetrieveCustomer(client);
            
            // Actualizar el stripeCustomerId del cliente si es necesario
            if (!client.stripeCustomerId) {
                client.stripeCustomerId = stripeCustomer.id;
                await client.save();
            }

            const payments = await stripeService.getCustomerPayments(client.stripeCustomerId);
            res.json(payments);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener pagos', error: error.message });
        }
    },

    // Obtener suscripciones de un cliente
    async getClientSubscriptions(req, res) {
        try {
            const client = await Client.findById(req.params.clientId);
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            // Crear o recuperar cliente en Stripe si es necesario
            const stripeCustomer = await stripeService.createOrRetrieveCustomer(client);
            
            // Actualizar el stripeCustomerId del cliente si es necesario
            if (!client.stripeCustomerId) {
                client.stripeCustomerId = stripeCustomer.id;
                await client.save();
            }

            const subscriptions = await stripeService.getCustomerSubscriptions(client.stripeCustomerId);
            res.json(subscriptions);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener suscripciones', error: error.message });
        }
    },

    // Obtener facturas de un cliente
    async getClientInvoices(req, res) {
        try {
            const client = await Client.findById(req.params.clientId);
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            // Crear o recuperar cliente en Stripe si es necesario
            const stripeCustomer = await stripeService.createOrRetrieveCustomer(client);
            
            // Actualizar el stripeCustomerId del cliente si es necesario
            if (!client.stripeCustomerId) {
                client.stripeCustomerId = stripeCustomer.id;
                await client.save();
            }

            const invoices = await stripeService.getCustomerInvoices(client.stripeCustomerId);
            res.json(invoices);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener facturas', error: error.message });
        }
    },

    // Obtener próxima factura de una suscripción
    async getUpcomingInvoice(req, res) {
        try {
            const { clientId, subscriptionId } = req.params;
            const client = await Client.findById(clientId);
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            // Crear o recuperar cliente en Stripe si es necesario
            const stripeCustomer = await stripeService.createOrRetrieveCustomer(client);
            
            // Actualizar el stripeCustomerId del cliente si es necesario
            if (!client.stripeCustomerId) {
                client.stripeCustomerId = stripeCustomer.id;
                await client.save();
            }

            const upcomingInvoice = await stripeService.getUpcomingInvoice(
                client.stripeCustomerId,
                subscriptionId
            );
            res.json(upcomingInvoice);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener próxima factura', error: error.message });
        }
    },

    // Obtener resumen de ingresos por período
    async getRevenueSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Se requieren fechas de inicio y fin' });
            }

            const summary = await stripeService.getRevenueSummary(
                Math.floor(new Date(startDate).getTime() / 1000),
                Math.floor(new Date(endDate).getTime() / 1000)
            );
            res.json(summary);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener resumen de ingresos', error: error.message });
        }
    },

    // Obtener detalles de un pago específico
    async getPaymentDetails(req, res) {
        try {
            const { paymentId } = req.params;
            const paymentDetails = await stripeService.getPaymentDetails(paymentId);
            res.json(paymentDetails);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener detalles del pago', error: error.message });
        }
    },

    // Crear una nueva suscripción para un cliente
    async createSubscription(req, res) {
        try {
            const { clientId } = req.params;
            const { priceId, successUrl, cancelUrl } = req.body;

            if (!priceId) {
                return res.status(400).json({ message: 'Se requiere el ID del precio' });
            }

            const session = await stripeService.createSubscription(
                clientId, 
                priceId,
                successUrl,
                cancelUrl
            );
        
            res.json(session);
        } catch (error) {
            console.error('Error al crear la suscripción:', error);
            res.status(500).json({
                message: 'Error al crear la suscripción',
                error: error.message
            });
        }
    },

    // Crear un SetupIntent para agregar método de pago
    async createSetupIntent(req, res) {
        try {
            const { clientId } = req.params;
            const setupIntent = await stripeService.createSetupIntent(clientId);
            res.json(setupIntent);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear el SetupIntent', error: error.message });
        }
    },

    // Actualizar una suscripción existente
    async updateSubscription(req, res) {
        try {
            const { subscriptionId } = req.params;
            const updateData = req.body;

            const subscription = await stripeService.updateSubscription(
                subscriptionId,
                updateData
            );

            res.json(subscription);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar la suscripción', error: error.message });
        }
    },

    // Crear una nueva factura para un cliente
    async createInvoice(req, res) {
        try {
            const { clientId } = req.params;
            const { items, options } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Se requiere al menos un item para la factura' });
            }

            const invoice = await stripeService.createInvoice(clientId, items, options);
            res.json(invoice);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear la factura', error: error.message });
        }
    },

    // Crear un producto con precio
    async createProductWithPrice(req, res) {
        try {
            const productData = {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                currency: req.body.currency,
                recurring: req.body.recurring
            };

            const result = await stripeService.createProductWithPrice(productData);
            res.json(result);
        } catch (error) {
            console.error('Error al crear producto con precio:', error);
            res.status(500).json({
                message: 'Error al crear el producto con precio',
                error: error.message
            });
        }
    },

    // Listar productos
    async listProducts(req, res) {
        try {
            const products = await stripeService.listProducts();
            res.json(products);
        } catch (error) {
            console.error('Error al listar productos:', error);
            res.status(500).json({
                message: 'Error al listar productos',
                error: error.message
            });
        }
    },

    // Obtener estado de la suscripción
    async getSubscriptionStatus(req, res) {
        try {
            const { clientId } = req.params;
            
            const client = await Client.findById(clientId);
            
            if (!client) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            // Si el cliente no tiene suscripción
            if (!client.subscription || !client.subscription.id) {
                return res.json({
                    status: 'none',
                    message: 'El cliente no tiene una suscripción activa'
                });
            }

            // Obtener la suscripción actualizada de Stripe
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            const subscription = await stripe.subscriptions.retrieve(client.subscription.id);

            // Actualizar el estado en nuestra base de datos si ha cambiado
            if (subscription.status !== client.subscription.status) {
                await Client.findByIdAndUpdate(clientId, {
                    'subscription.status': subscription.status,
                    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
                });
            }

            return res.json({
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                priceId: subscription.items.data[0].price.id,
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            });
        } catch (error) {
            console.error('Error al obtener estado de suscripción:', error);
            res.status(500).json({
                message: 'Error al obtener estado de suscripción',
                error: error.message
            });
        }
    }
};

module.exports = paymentInfoController;
