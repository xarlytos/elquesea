// controllers/chatController.js
const OpenAI = require('openai');

console.log('Iniciando controlador de chat...');

// Configura tu clave de API de OpenAI utilizando variables de entorno
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('Cliente OpenAI inicializado correctamente');

// Prompts específicos para cada chat
const prompts = {
  1: "Eres un experto en creación de posts virales para redes sociales. Ayuda al usuario a generar contenido atractivo y relevante.",
  2: "Eres un especialista en diseño de historias para redes sociales. Ayuda al usuario a crear historias que conecten con su audiencia.",
  3: "Eres un generador de imágenes por IA. Ayuda al usuario a describir imágenes que desee generar.",
  4: "Eres un analista de audiencia de marketing digital. Proporciona insights sobre la segmentación y comportamiento del público objetivo.",
  5: "Eres un detector de tendencias de mercado. Ayuda al usuario a identificar y aprovechar las últimas tendencias.",
  6: "Eres un experto en marketing de contenidos. Ayuda al usuario a desarrollar estrategias efectivas de contenido.",
  7: "Eres un especialista en SEO. Ayuda al usuario a optimizar su contenido para motores de búsqueda.",
  8: "Eres un experto en email marketing. Ayuda al usuario a crear campañas efectivas de correo electrónico.",
  9: "Eres un analista de métricas digitales. Ayuda al usuario a interpretar y actuar sobre datos de marketing."
};

exports.handleChat = async (chatNumber, req, res) => {
  console.log('\n=== NUEVA SOLICITUD DE CHAT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers recibidos:', req.headers);
  console.log('Body completo:', req.body);
  console.log('Número de chat:', chatNumber);

  const { query } = req.body;
  console.log('Query extraída:', query);

  if (!query) {
    console.log('Error: Query no proporcionada');
    return res.status(400).json({ error: 'El campo "query" es requerido.' });
  }

  const prompt = prompts[chatNumber];
  console.log('Prompt seleccionado:', prompt);

  try {
    console.log('\n=== PREPARANDO SOLICITUD A OPENAI ===');
    const messages = [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: query
      }
    ];
    console.log('Mensajes a enviar:', JSON.stringify(messages, null, 2));

    console.log('Iniciando llamada a OpenAI...');
    console.time('Tiempo de respuesta OpenAI');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      n: 1
    });
    console.timeEnd('Tiempo de respuesta OpenAI');

    console.log('\n=== RESPUESTA DE OPENAI RECIBIDA ===');
    console.log('Respuesta completa:', JSON.stringify(completion, null, 2));

    const answer = completion.choices[0].message.content.trim();
    console.log('Respuesta procesada:', answer);

    console.log('\n=== ENVIANDO RESPUESTA AL CLIENTE ===');
    const responseObj = { answer };
    console.log('Objeto de respuesta:', responseObj);

    res.json(responseObj);
    console.log('Respuesta enviada exitosamente');

  } catch (error) {
    console.error('\n=== ERROR EN EL PROCESAMIENTO ===');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.response) {
      console.error('Detalles del error de OpenAI:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    res.status(500).json({ 
      error: 'Error al procesar la solicitud con OpenAI.',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.constructor.name,
        ...(error.response && { openaiError: error.response.data })
      } : undefined
    });
  }
};
