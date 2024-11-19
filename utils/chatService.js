// utils/chatService.js
const Chat = require('../models/Chat');
const Trainer = require('../models/Trainer');
const openai = require('openai'); // Asegúrate de configurar la inicialización de OpenAI en otro lugar, o aquí mismo

/**
 * Función para interactuar con la API de OpenAI y registrar los tokens utilizados.
 * @param {String} trainerId - El ID del entrenador
 * @param {String} userMessage - Mensaje enviado por el entrenador
 * @returns {Object} assistantMessage y tokensUsed
 */
async function interactWithChatGPT(trainerId, userMessage) {
  try {
    // 1. Realiza la solicitud a la API de OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });

    const assistantMessage = response.choices[0].message.content;
    const tokensUsed = response.usage.total_tokens;

    // 2. Crea o actualiza la conversación en el modelo `Chat`
    const chat = await Chat.findOneAndUpdate(
      { trainer: trainerId },
      {
        $push: {
          conversation: [
            { role: 'trainer', message: userMessage, tokens: tokensUsed },
            { role: 'assistant', message: assistantMessage, tokens: tokensUsed },
          ],
        },
        $inc: { totalTokens: tokensUsed },
      },
      { new: true, upsert: true }
    );

    // 3. Actualiza el campo `tokensUsados` en el modelo `Trainer`
    await Trainer.findByIdAndUpdate(trainerId, { $inc: { tokensUsados: tokensUsed } });

    return { assistantMessage, tokensUsed };
  } catch (error) {
    console.error('Error interacting with ChatGPT:', error);
    throw error;
  }
}

module.exports = { interactWithChatGPT };
