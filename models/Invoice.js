// models/Invoice.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Subschema para los servicios
const servicioSchema = new Schema({
  codigo: { type: String, required: true },
  iva: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  precioUnitario: { type: Number, required: true, min: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
});

// Subschema para los documentos adicionales
const documentoSchema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const invoiceSchema = new Schema({
  // Información Básica
  numeroFactura: { type: String, unique: true, required: true },
  fecha: { type: Date, default: Date.now },
  metodoPago: { 
    type: String, 
    enum: ['transferencia', 'tarjeta', 'efectivo'], 
    required: true 
  },
  tipoFactura: { 
    type: String, 
    enum: ['simple', 'completa', 'proforma'], 
    required: true 
  },
  
  // Servicios
  servicios: {
    type: [servicioSchema],
    validate: [arrayLimit, '{PATH} debe tener al menos un servicio']
  },
  
  // Cálculo del Total
  totalAmount: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'EUR', 'MXN'], required: true },
  
  // Datos de la Empresa
  nombreEmpresa: { type: String, required: true },
  nifEmpresa: { type: String, required: true },
  emailEmpresa: { 
    type: String, 
    required: true, 
    match: [/.+\@.+\..+/, 'Por favor ingresa un email válido'] 
  },
  
  // Información Adicional
  comentario: { type: String },
  documentosAdicionales: [documentoSchema],
  
  // Estado y Referencias
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  ],
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  trainer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trainer', 
    required: true 
  },
  
}, { timestamps: true });

// Validación para asegurarse de que haya al menos un servicio
function arrayLimit(val) {
  return val.length > 0;
}

// Middleware para calcular automáticamente el totalAmount antes de guardar
invoiceSchema.pre('validate', function(next) {
  let total = 0;
  this.servicios.forEach(servicio => {
    const subtotal = servicio.precioUnitario * servicio.cantidad;
    const descuento = subtotal * (servicio.descuento / 100);
    const iva = (subtotal - descuento) * (servicio.iva / 100);
    total += subtotal - descuento + iva;
  });
  this.totalAmount = total;
  next();
});


module.exports = mongoose.model('Invoice', invoiceSchema);
