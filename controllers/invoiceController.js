const Invoice = require('../models/Invoice');
const Service = require('../models/Service'); // Modelo de servicio
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const nodemailer = require('nodemailer');
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper para generar un número único
const generateUniqueNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createInvoice = async (req, res) => {
  try {
    const { description, totalAmount, currency, service, notes, clientId, trainerId } = req.body;

    // Validar referencias
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });

    const referencedService = await Service.findById(service);
    if (!referencedService) return res.status(404).json({ message: 'Servicio no encontrado.' });

    const invoice = new Invoice({
      number: generateUniqueNumber(),
      description,
      totalAmount,
      currency,
      service,
      notes,
      client: clientId,
      trainer: trainerId,
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creando la factura', error: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { invoiceId, transactionId } = req.body;

    const invoice = await Invoice.findById(invoiceId).populate('transactions');
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada.' });

    invoice.transactions.push(transactionId);

    // Actualizar estado según transacciones
    const totalPaid = invoice.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'pending';
    }

    await invoice.save();
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error registrando el pago', error: error.message });
  }
};

const sendInvoiceByEmail = async (req, res) => {
  try {
    const { invoiceId, email } = req.body;

    const invoice = await Invoice.findById(invoiceId)
      .populate('client')
      .populate('trainer')
      .populate('service');
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada.' });

    // Crear PDF
    const pdfPath = path.join(__dirname, `../invoices/${invoice.number}.pdf`);
    const doc = new pdf();

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text(`Invoice Number: ${invoice.number}`);
    doc.fontSize(14).text(`Description: ${invoice.description}`);
    doc.text(`Total Amount: ${invoice.currency} ${invoice.totalAmount}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Client: ${invoice.client.name}`);
    doc.text(`Trainer: ${invoice.trainer.name}`);
    doc.text(`Service: ${invoice.service.name}`);
    doc.text(`Notes: ${invoice.notes || 'N/A'}`);
    doc.end();

    // Configurar transporte Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enviar email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invoice ${invoice.number}`,
      text: 'Adjunto encontrará su factura.',
      attachments: [{ filename: `${invoice.number}.pdf`, path: pdfPath }],
    });

    res.status(200).json({ message: 'Factura enviada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error enviando la factura', error: error.message });
  }
};

module.exports = {
  createInvoice,
  recordPayment,
  sendInvoiceByEmail,
};
