const Client = require('../../models/Client');
const stripeService = require('./stripeService');

const paymentMethodService = {
    // Crear o actualizar el cliente en Stripe
    async setupCustomer(clientId, paymentMethodId) {
        try {
            if (!stripeService.isStripeEnabled()) {
                console.log('Stripe no está configurado - no se puede crear o actualizar cliente');
                throw new Error('Stripe no está configurado');
            }

            const client = await Client.findById(clientId);
            if (!client) {
                throw new Error('Cliente no encontrado');
            }

            let stripeCustomerId = client.stripeCustomerId;

            // Si el cliente no existe en Stripe, créalo
            if (!stripeCustomerId) {
                const stripe = stripeService.getStripeInstance();
                const customer = await stripe.customers.create({
                    email: client.email,
                    name: `${client.nombre} ${client.apellidos}`,
                    payment_method: paymentMethodId,
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
                stripeCustomerId = customer.id;

                // Actualizar el cliente en nuestra base de datos
                client.stripeCustomerId = stripeCustomerId;
                client.metodoPagoPredeterminado = paymentMethodId;
                await client.save();
            } else {
                // Si ya existe, actualiza su método de pago predeterminado
                const stripe = stripeService.getStripeInstance();
                await stripe.customers.update(stripeCustomerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
                client.metodoPagoPredeterminado = paymentMethodId;
                await client.save();
            }

            return {
                stripeCustomerId,
                paymentMethodId
            };
        } catch (error) {
            console.error('Error en setupCustomer:', error);
            throw error;
        }
    },

    // Obtener los métodos de pago del cliente
    async getPaymentMethods(clientId) {
        try {
            if (!stripeService.isStripeEnabled()) {
                console.log('Stripe no está configurado - no se pueden obtener métodos de pago');
                return [];
            }

            const client = await Client.findById(clientId);
            if (!client || !client.stripeCustomerId) {
                throw new Error('Cliente no encontrado o sin métodos de pago');
            }

            const stripe = stripeService.getStripeInstance();
            const paymentMethods = await stripe.paymentMethods.list({
                customer: client.stripeCustomerId,
                type: 'card'
            });

            return paymentMethods.data;
        } catch (error) {
            console.error('Error en getPaymentMethods:', error);
            throw error;
        }
    },

    // Eliminar un método de pago
    async removePaymentMethod(clientId, paymentMethodId) {
        try {
            if (!stripeService.isStripeEnabled()) {
                console.log('Stripe no está configurado - no se puede eliminar método de pago');
                return { success: false, error: 'Stripe no está configurado' };
            }

            const client = await Client.findById(clientId);
            if (!client || !client.stripeCustomerId) {
                throw new Error('Cliente no encontrado o sin métodos de pago');
            }

            const stripe = stripeService.getStripeInstance();
            await stripe.paymentMethods.detach(paymentMethodId);

            // Si era el método predeterminado, limpiarlo
            if (client.metodoPagoPredeterminado === paymentMethodId) {
                client.metodoPagoPredeterminado = null;
                await client.save();
            }

            return { success: true };
        } catch (error) {
            console.error('Error en removePaymentMethod:', error);
            throw error;
        }
    }
};

module.exports = paymentMethodService;
