// controllers/services/stripeService.js

// Detecta si el entorno es de prueba o desarrollo
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Client = require('../../models/Client');
let stripeInstance = null;

/**
 * Obtiene una instancia de Stripe, inicializándola si es necesario
 */
function getStripeInstance() {
  if (!stripeInstance && !isTestEnv) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
    }
    stripeInstance = stripe;
  }
  return stripeInstance;
}

/**
 * Crea un nuevo producto en Stripe
 */
async function createProduct(name, description) {
  if (isTestEnv) {
    return { id: `prod_test_${Date.now()}` };
  }
  const stripe = getStripeInstance();
  return await stripe.products.create({ name, description });
}

/**
 * Crea un precio en Stripe
 */
async function createPrice(productId, amount, currency, interval = null) {
  if (isTestEnv) {
    return { id: `price_test_${Date.now()}` };
  }
  const stripe = getStripeInstance();
  const params = {
    product: productId,
    unit_amount: amount,
    currency: currency.toLowerCase(),
  };
  if (interval) {
    params.recurring = { interval };
  }
  return await stripe.prices.create(params);
}

/**
 * Crea un producto con precio
 */
async function createProductWithPrice(productData) {
    const stripe = getStripeInstance();
    try {
        // Crear el producto
        const product = await stripe.products.create({
            name: productData.name,
            description: productData.description
        });

        // Crear el precio para el producto
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(productData.price * 100), // Convertir a centavos
            currency: productData.currency || 'eur',
            recurring: productData.recurring ? {
                interval: productData.recurring.interval || 'month',
                interval_count: productData.recurring.interval_count || 1
            } : null
        });

        return {
            product: product,
            price: price
        };
    } catch (error) {
        console.error('Error al crear producto con precio:', error);
        throw error;
    }
}

/**
 * Listar todos los productos con sus precios
 */
async function listProducts() {
    const stripe = getStripeInstance();
    try {
        const products = await stripe.products.list({
            active: true,
            expand: ['data.default_price']
        });

        // Obtener precios para cada producto
        const productsWithPrices = await Promise.all(
            products.data.map(async (product) => {
                const prices = await stripe.prices.list({
                    product: product.id,
                    active: true
                });
                return {
                    ...product,
                    prices: prices.data
                };
            })
        );

        return productsWithPrices;
    } catch (error) {
        console.error('Error al listar productos:', error);
        throw error;
    }
}

/**
 * Crea una sesión de configuración para agregar método de pago
 */
async function createSetupIntent(clientId) {
    const stripe = getStripeInstance();
    try {
        const client = await Client.findById(clientId);
        if (!client) {
            throw new Error('Cliente no encontrado');
        }

        // Asegurarse de que el cliente exista en Stripe
        const stripeCustomer = await createOrRetrieveCustomer(clientId);

        // Crear el SetupIntent
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomer.id,
            payment_method_types: ['card'],
            usage: 'off_session', // Permite usar el método de pago para cargos futuros
        });

        return setupIntent;
    } catch (error) {
        console.error('Error al crear SetupIntent:', error);
        throw error;
    }
}

/**
 * Crea una suscripción para un cliente
 */
async function createSubscription(clientId, priceId, successUrl, cancelUrl) {
    const stripe = getStripeInstance();
    try {
        // Obtener o crear el cliente en Stripe
        const customer = await createOrRetrieveCustomer(clientId);

        // Crear la sesión de Checkout
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: successUrl || process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cancel',
        });

        return session;
    } catch (error) {
        console.error('Error al crear suscripción:', error);
        throw error;
    }
}

/**
 * Elimina un producto en Stripe
 */
async function deleteProduct(productId) {
  if (isTestEnv) {
    return true;
  }
  const stripe = getStripeInstance();
  return await stripe.products.del(productId);
}

/**
 * Cancela una suscripción en Stripe
 */
async function cancelSubscription(subscriptionId) {
  if (isTestEnv) {
    return true;
  }
  const stripe = getStripeInstance();
  return await stripe.subscriptions.del(subscriptionId);
}

/**
 * Crear un enlace de pago para una suscripción
 */
async function createPaymentLink(planData, clientId, successUrl, cancelUrl) {
  try {
    const stripe = getStripeInstance();
    // Crear o recuperar el producto en Stripe
    let product;
    if (planData.stripeProductId) {
      product = await stripe.products.retrieve(planData.stripeProductId);
    } else {
      product = await stripe.products.create({
        name: planData.nombre,
        description: planData.detalles || 'Plan de entrenamiento'
      });
    }

    // Crear o recuperar el precio en Stripe
    let price;
    if (planData.stripePriceId) {
      price = await stripe.prices.retrieve(planData.stripePriceId);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(planData.precio * 100), // Stripe usa centavos
        currency: planData.moneda || 'eur',
        recurring: {
          interval: planData.frecuencia.toLowerCase() === 'mensual' ? 'month' : 'year'
        }
      });
    }

    // Crear la sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&client_id=${clientId}&plan_id=${planData._id}`,
      cancel_url: cancelUrl,
      client_reference_id: clientId,
      metadata: {
        planId: planData._id.toString(),
        clientId: clientId
      }
    });

    return {
      sessionId: session.id,
      url: session.url,
      priceId: price.id,
      productId: product.id
    };
  } catch (error) {
    console.error('Error creando enlace de pago:', error);
    throw error;
  }
}

/**
 * Verificar y procesar una sesión de checkout completada
 */
async function handleCheckoutComplete(sessionId) {
  try {
    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (session.payment_status === 'paid') {
      return {
        success: true,
        clientId: session.metadata.clientId,
        planId: session.metadata.planId,
        subscriptionId: session.subscription.id,
        customerId: session.customer
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Error procesando checkout:', error);
    throw error;
  }
}

// Crear o recuperar un cliente en Stripe
async function createOrRetrieveCustomer(clientId) {
    const stripe = getStripeInstance();
    try {
        // Primero, obtener el cliente de la base de datos
        const client = await Client.findById(clientId);
        
        if (!client) {
            throw new Error('Cliente no encontrado');
        }

        if (client.stripeCustomerId) {
            // Si ya tiene ID de Stripe, recuperar el cliente
            return await stripe.customers.retrieve(client.stripeCustomerId);
        }

        // Si no tiene ID de Stripe, crear nuevo cliente
        const customer = await stripe.customers.create({
            email: client.email,
            name: `${client.nombre} ${client.apellidos || ''}`.trim(),
            metadata: {
                clientId: client._id.toString()
            }
        });

        // Actualizar el cliente en la base de datos con su ID de Stripe
        await Client.findByIdAndUpdate(clientId, { stripeCustomerId: customer.id });

        return customer;
    } catch (error) {
        console.error('Error en createOrRetrieveCustomer:', error);
        throw error;
    }
}

/**
 * Actualizar una suscripción existente
 */
async function updateSubscription(subscriptionId, updateData) {
    const stripe = getStripeInstance();
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            ...updateData,
            proration_behavior: updateData.proration_behavior || 'create_prorations'
        });
        return subscription;
    } catch (error) {
        console.error('Error al actualizar suscripción:', error);
        throw error;
    }
}

// Crear una factura manual para un cliente
async function createInvoice(clientId, items, options = {}) {
    const stripe = getStripeInstance();
    try {
        const client = await Client.findById(clientId);
        if (!client) {
            throw new Error('Cliente no encontrado');
        }

        // Asegurarse de que el cliente exista en Stripe
        const stripeCustomer = await createOrRetrieveCustomer(clientId);

        // Crear la factura
        const invoice = await stripe.invoices.create({
            customer: stripeCustomer.id,
            auto_advance: options.auto_advance !== false, // Enviar automáticamente al cliente
            collection_method: options.collection_method || 'charge_automatically',
            days_until_due: options.days_until_due || null,
        });

        // Agregar items a la factura
        for (const item of items) {
            await stripe.invoiceItems.create({
                customer: stripeCustomer.id,
                invoice: invoice.id,
                amount: Math.round(item.amount * 100), // Convertir a centavos
                currency: item.currency || 'eur',
                description: item.description
            });
        }

        // Finalizar la factura
        if (options.finalize !== false) {
            await stripe.invoices.finalizeInvoice(invoice.id);
        }

        // Enviar la factura por email
        if (options.send_email !== false) {
            await stripe.invoices.send(invoice.id);
        }

        return invoice;
    } catch (error) {
        console.error('Error al crear factura:', error);
        throw error;
    }
}

// Funciones para manejar clientes
async function getCustomerPayments(stripeCustomerId) {
    const stripe = getStripeInstance();
    try {
        const paymentIntents = await stripe.paymentIntents.list({
            customer: stripeCustomerId,
            limit: 100
        });
        return paymentIntents.data;
    } catch (error) {
        console.error('Error al obtener pagos del cliente:', error);
        throw error;
    }
}

async function getCustomerSubscriptions(stripeCustomerId) {
    const stripe = getStripeInstance();
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
}

async function getCustomerInvoices(stripeCustomerId) {
    const stripe = getStripeInstance();
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
}

async function getUpcomingInvoice(stripeCustomerId, subscriptionId) {
    const stripe = getStripeInstance();
    try {
        return await stripe.invoices.retrieveUpcoming({
            customer: stripeCustomerId,
            subscription: subscriptionId
        });
    } catch (error) {
        console.error('Error al obtener próxima factura:', error);
        throw error;
    }
}

async function getRevenueSummary(startDate, endDate) {
    const stripe = getStripeInstance();
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
            total: summary.total / 100,
            periodStart: new Date(startDate * 1000),
            periodEnd: new Date(endDate * 1000)
        };
    } catch (error) {
        console.error('Error al obtener resumen de ingresos:', error);
        throw error;
    }
}

async function getPaymentDetails(paymentIntentId) {
    const stripe = getStripeInstance();
    try {
        return await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['customer', 'payment_method']
        });
    } catch (error) {
        console.error('Error al obtener detalles del pago:', error);
        throw error;
    }
}

/**
 * Manejar eventos de webhook de Stripe
 */
async function handleWebhookEvent(event) {
    const stripe = getStripeInstance();
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                
                // Verificar si es una suscripción
                if (session.mode === 'subscription') {
                    // Obtener la suscripción
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    
                    // Obtener el cliente de nuestra base de datos usando el metadata
                    const Client = require('../../models/Client');
                    const clientId = session.metadata.clientId;
                    
                    if (clientId) {
                        // Actualizar el cliente con la información de la suscripción
                        await Client.findByIdAndUpdate(clientId, {
                            $set: {
                                'subscription.id': subscription.id,
                                'subscription.status': subscription.status,
                                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                                'subscription.priceId': subscription.items.data[0].price.id
                            }
                        });
                    }
                }
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                const Client = require('../../models/Client');
                
                // Buscar el cliente por el ID de cliente de Stripe
                const client = await Client.findOne({ stripeCustomerId: subscription.customer });
                
                if (client) {
                    // Actualizar el estado de la suscripción
                    await Client.findByIdAndUpdate(client._id, {
                        $set: {
                            'subscription.status': subscription.status,
                            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
                        }
                    });
                }
                break;
        }
    } catch (error) {
        console.error('Error al manejar webhook:', error);
        throw error;
    }
}

module.exports = {
    createProduct,
    createPrice,
    createProductWithPrice,
    listProducts,
    createSubscription,
    createSetupIntent,
    updateSubscription,
    deleteProduct,
    cancelSubscription,
    createPaymentLink,
    handleCheckoutComplete,
    createOrRetrieveCustomer,
    getCustomerPayments,
    getCustomerSubscriptions,
    getCustomerInvoices,
    getUpcomingInvoice,
    getRevenueSummary,
    getPaymentDetails,
    createInvoice,
    handleWebhookEvent
};
