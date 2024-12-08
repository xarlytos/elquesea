const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Client = require('../../models/Client');

const paymentMethodService = {
    // Crear o actualizar el cliente en Stripe
    async setupCustomer(clientId, paymentMethodId) {
        try {
            const client = await Client.findById(clientId);
            if (!client) {
                throw new Error('Cliente no encontrado');
            }

            let stripeCustomerId = client.stripeCustomerId;

            // Si el cliente no existe en Stripe, créalo
            if (!stripeCustomerId) {
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
            const client = await Client.findById(clientId);
            if (!client || !client.stripeCustomerId) {
                throw new Error('Cliente no encontrado o sin métodos de pago');
            }

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
            const client = await Client.findById(clientId);
            if (!client || !client.stripeCustomerId) {
                throw new Error('Cliente no encontrado o sin métodos de pago');
            }

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
