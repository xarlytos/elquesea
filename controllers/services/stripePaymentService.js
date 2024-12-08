const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripePaymentService = {
    // Obtener todos los pagos de un cliente
    async getCustomerPayments(stripeCustomerId) {
        try {
            const payments = await stripe.paymentIntents.list({
                customer: stripeCustomerId,
                limit: 100
            });
            return payments.data;
        } catch (error) {
            console.error('Error al obtener pagos del cliente:', error);
            throw error;
        }
    },

    // Obtener todas las suscripciones de un cliente
    async getCustomerSubscriptions(stripeCustomerId) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: 'all',
                expand: ['data.default_payment_method']
            });
            return subscriptions.data;
        } catch (error) {
            console.error('Error al obtener suscripciones del cliente:', error);
            throw error;
        }
    },

    // Obtener facturas de un cliente
    async getCustomerInvoices(stripeCustomerId) {
        try {
            const invoices = await stripe.invoices.list({
                customer: stripeCustomerId,
                limit: 100
            });
            return invoices.data;
        } catch (error) {
            console.error('Error al obtener facturas del cliente:', error);
            throw error;
        }
    },

    // Obtener próximos pagos programados
    async getUpcomingInvoice(stripeCustomerId, subscriptionId) {
        try {
            const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
                customer: stripeCustomerId,
                subscription: subscriptionId
            });
            return upcomingInvoice;
        } catch (error) {
            console.error('Error al obtener próxima factura:', error);
            throw error;
        }
    },

    // Obtener resumen de ingresos por período
    async getRevenueSummary(startDate, endDate) {
        try {
            const charges = await stripe.charges.list({
                created: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'succeeded'
            });

            const summary = charges.data.reduce((acc, charge) => {
                return {
                    total: acc.total + charge.amount,
                    count: acc.count + 1,
                    currency: charge.currency
                };
            }, { total: 0, count: 0, currency: 'eur' });

            return {
                ...summary,
                total: summary.total / 100, // Convertir de centavos a euros
                periodStart: new Date(startDate * 1000),
                periodEnd: new Date(endDate * 1000)
            };
        } catch (error) {
            console.error('Error al obtener resumen de ingresos:', error);
            throw error;
        }
    },

    // Obtener detalles de un pago específico
    async getPaymentDetails(paymentIntentId) {
        try {
            const payment = await stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ['customer', 'payment_method']
            });
            return payment;
        } catch (error) {
            console.error('Error al obtener detalles del pago:', error);
            throw error;
        }
    }
};

module.exports = stripePaymentService;
