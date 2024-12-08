const mongoose = require('mongoose');
const { Schema } = mongoose;

const TrainerClientChatSchema = new Schema({
    trainer: {
        type: Schema.Types.ObjectId,
        ref: 'Trainer',
        required: true
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    ultimoMensaje: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    fechaUltimoMensaje: {
        type: Date
    },
    estado: {
        type: String,
        enum: ['activo', 'archivado'],
        default: 'activo'
    }
}, {
    timestamps: true
});

// Crear índice único compuesto para trainer y cliente
TrainerClientChatSchema.index({ trainer: 1, cliente: 1 }, { unique: true });

// Índices para mejorar el rendimiento de las consultas
TrainerClientChatSchema.index({ fechaUltimoMensaje: -1 });

// Método para obtener los mensajes no leídos de una conversación
TrainerClientChatSchema.methods.getMensajesNoLeidos = async function(userId) {
    const Message = mongoose.model('Message');
    return await Message.countDocuments({
        conversacion: this._id,
        receptor: userId,
        leido: false
    });
};

module.exports = mongoose.model('TrainerClientChat', TrainerClientChatSchema);
