// controllers/chatController.js
const { interactWithChatGPT } = require('../utils/chatService');

exports.chatWithGPT = async (req, res) => {
  const { trainerId } = req.params;
  const { message } = req.body;

  try {
    const { assistantMessage, tokensUsed } = await interactWithChatGPT(trainerId, message);

    res.status(200).json({
      message: 'Conversación registrada exitosamente',
      assistantMessage,
      tokensUsed,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en la conversación con ChatGPT', error });
  }
};
