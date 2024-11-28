// controllers/invoiceController.js

const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer'); // Asegúrate de tener este modelo
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper para generar un número único
const generateUniqueNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createInvoice = async (req, res) => {
  try {
    const {
      numeroFactura,
      fecha,
      metodoPago,
      tipoFactura,
      servicios,
      nombreEmpresa,
      nifEmpresa,
      emailEmpresa,
      comentario,
      clienteId,
      trainerId,
      currency,
    } = req.body;

    console.log('Datos recibidos en createInvoice:', req.body);

    // Validar referencias
    const client = await Client.findById(clienteId);
    if (!client) {
      console.error('Cliente no encontrado con ID:', clienteId);
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      console.error('Entrenador no encontrado con ID:', trainerId);
      return res.status(404).json({ message: 'Entrenador no encontrado.' });
    }

    // Manejar documentos adicionales
    let documentosAdicionales = [];
    if (req.files && req.files.length > 0) {
      documentosAdicionales = req.files.map(file => ({
        filename: file.filename,
        url: `/uploads/documentosAdicionales/${file.filename}`,
      }));
      console.log('Documentos adicionales:', documentosAdicionales);
    }

    // Parsear 'servicios' si es una cadena
    let serviciosParsed = servicios;
    if (typeof servicios === 'string') {
      try {
        serviciosParsed = JSON.parse(servicios);
      } catch (error) {
        console.error('Error al parsear el campo servicios:', error);
        return res.status(400).json({ message: 'El formato de servicios es inválido.' });
      }
    }

    // Crear nueva factura
    const invoice = new Invoice({
      numeroFactura: numeroFactura || generateUniqueNumber(),
      fecha: fecha ? new Date(fecha) : Date.now(),
      metodoPago,
      tipoFactura,
      servicios: serviciosParsed, // Ahora es un array de objetos
      nombreEmpresa,
      nifEmpresa,
      emailEmpresa,
      comentario,
      documentosAdicionales,
      currency,
      client: clienteId,
      trainer: trainerId,
      // totalAmount se calcula automáticamente en el middleware pre-save
    });

    console.log('Factura creada antes de guardar:', invoice);

    await invoice.save();

    console.log('Factura guardada exitosamente:', invoice);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creando la factura:', error);
    res.status(500).json({ message: 'Error creando la factura', error: error.message });
  }
};

// Obtener una factura por ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('client')
      .populate('trainer')
      .populate('transactions');

    if (!invoice) {
      console.error('Factura no encontrada con ID:', id);
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error obteniendo la factura:', error);
    res.status(500).json({ message: 'Error obteniendo la factura', error: error.message });
  }
};

// Obtener todas las facturas
const getAllInvoices = async (req, res) => {
  try {
    const { clienteId, trainerId, status, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;

    // Construir el filtro
    let filter = {};
    if (clienteId) filter.client = clienteId;
    if (trainerId) filter.trainer = trainerId;
    if (status) filter.status = status;
    if (fechaInicio || fechaFin) {
      filter.fecha = {};
      if (fechaInicio) filter.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filter.fecha.$lte = new Date(fechaFin);
    }

    console.log('Filtros para obtener facturas:', filter);

    const invoices = await Invoice.find(filter)
      .populate('client')
      .populate('trainer')
      .populate('transactions')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      invoices,
    });
  } catch (error) {
    console.error('Error obteniendo las facturas:', error);
    res.status(500).json({ message: 'Error obteniendo las facturas', error: error.message });
  }
};

// Actualizar una factura
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numeroFactura,
      fecha,
      metodoPago,
      tipoFactura,
      servicios,
      nombreEmpresa,
      nifEmpresa,
      emailEmpresa,
      comentario,
      clienteId,
      trainerId,
      currency,
      status,
    } = req.body;

    console.log('Datos para actualizar en updateInvoice:', req.body);

    // Encontrar la factura
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      console.error('Factura no encontrada con ID:', id);
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    // Actualizar campos
    if (numeroFactura) invoice.numeroFactura = numeroFactura;
    if (fecha) invoice.fecha = new Date(fecha);
    if (metodoPago) invoice.metodoPago = metodoPago;
    if (tipoFactura) invoice.tipoFactura = tipoFactura;
    if (servicios) invoice.servicios = servicios; // Ya es un array de objetos
    if (nombreEmpresa) invoice.nombreEmpresa = nombreEmpresa;
    if (nifEmpresa) invoice.nifEmpresa = nifEmpresa;
    if (emailEmpresa) invoice.emailEmpresa = emailEmpresa;
    if (comentario) invoice.comentario = comentario;
    if (clienteId) {
      const client = await Client.findById(clienteId);
      if (!client) {
        console.error('Cliente no encontrado con ID:', clienteId);
        return res.status(404).json({ message: 'Cliente no encontrado.' });
      }
      invoice.client = clienteId;
    }
    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        console.error('Entrenador no encontrado con ID:', trainerId);
        return res.status(404).json({ message: 'Entrenador no encontrado.' });
      }
      invoice.trainer = trainerId;
    }
    if (currency) invoice.currency = currency;
    if (status) invoice.status = status;

    // Manejar documentos adicionales si se suben nuevos archivos
    if (req.files && req.files.length > 0) {
      const nuevosDocumentos = req.files.map(file => ({
        filename: file.filename,
        url: `/uploads/documentosAdicionales/${file.filename}`,
      }));
      invoice.documentosAdicionales.push(...nuevosDocumentos);
      console.log('Nuevos documentos adicionales agregados:', nuevosDocumentos);
    }

    console.log('Factura antes de guardar actualizada:', invoice);

    await invoice.save();

    console.log('Factura actualizada exitosamente:', invoice);
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error actualizando la factura:', error);
    res.status(500).json({ message: 'Error actualizando la factura', error: error.message });
  }
};

// Eliminar una factura
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      console.error('Factura no encontrada con ID:', id);
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    console.log('Factura eliminada exitosamente:', invoice);
    res.status(200).json({ message: 'Factura eliminada correctamente.' });
  } catch (error) {
    console.error('Error eliminando la factura:', error);
    res.status(500).json({ message: 'Error eliminando la factura', error: error.message });
  }
};

// Registrar un pago para una factura
const recordPayment = async (req, res) => {
  try {
    const { invoiceId, transactionId } = req.body;

    console.log(`Registrando pago: invoiceId=${invoiceId}, transactionId=${transactionId}`);

    const invoice = await Invoice.findById(invoiceId).populate('transactions');
    if (!invoice) {
      console.error('Factura no encontrada con ID:', invoiceId);
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      console.error('Transacción no encontrada con ID:', transactionId);
      return res.status(404).json({ message: 'Transacción no encontrada.' });
    }

    invoice.transactions.push(transactionId);
    console.log('Transacción agregada:', transactionId);

    // Actualizar estado según transacciones
    const totalPaid = invoice.transactions.reduce((sum, txn) => sum + txn.amount, 0);
    console.log(`Total pagado hasta ahora: ${totalPaid}`);

    if (totalPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else if (totalPaid > 0) {
      invoice.status = 'partial';
    } else {
      invoice.status = 'pending';
    }

    console.log(`Estado actualizado de la factura: ${invoice.status}`);

    await invoice.save();

    console.log('Factura después de registrar el pago:', invoice);
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error registrando el pago:', error);
    res.status(500).json({ message: 'Error registrando el pago', error: error.message });
  }
};

// Enviar la factura por correo electrónico
const sendInvoiceByEmail = async (req, res) => {
  try {
    const { invoiceId, email } = req.body;

    console.log(`Enviando factura: invoiceId=${invoiceId} a email=${email}`);

    const invoice = await Invoice.findById(invoiceId)
      .populate('client')
      .populate('trainer')
      .populate('transactions');

    if (!invoice) {
      console.error('Factura no encontrada con ID:', invoiceId);
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    // Crear PDF
    const invoicesDir = path.join(__dirname, '../invoices/');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
      console.log(`Creada la carpeta de invoices: ${invoicesDir}`);
    }

    const pdfPath = path.join(invoicesDir, `${invoice.numeroFactura}.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text(`Factura Número: ${invoice.numeroFactura}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Total: ${invoice.currency} ${invoice.totalAmount}`);
    doc.text(`Estado: ${invoice.status}`);
    doc.text(`Cliente: ${invoice.client.nombre}`);
    doc.text(`Entrenador: ${invoice.trainer.nombre}`);
    doc.text(`Notas: ${invoice.comentario || 'N/A'}`);
    doc.end();

    console.log(`PDF creado en: ${pdfPath}`);

    // Configurar transporte Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Asegúrate de configurar estas variables de entorno
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enviar email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Factura ${invoice.numeroFactura}`,
      text: 'Adjunto encontrará su factura.',
      attachments: [{ filename: `${invoice.numeroFactura}.pdf`, path: pdfPath }],
    });

    console.log('Factura enviada por correo electrónico exitosamente.');
    res.status(200).json({ message: 'Factura enviada correctamente.' });
  } catch (error) {
    console.error('Error enviando la factura:', error);
    res.status(500).json({ message: 'Error enviando la factura', error: error.message });
  }
};

module.exports = {
  createInvoice,
  getInvoiceById,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  sendInvoiceByEmail,
};
