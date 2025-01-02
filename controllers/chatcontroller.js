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

exports.handleContentStrategy = async (req, res) => {
  console.log('\n=== NUEVA SOLICITUD DE ESTRATEGIA DE CONTENIDO ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { contentStrategy } = req.body;
    
    if (!contentStrategy || !contentStrategy.objective || !contentStrategy.contentTypes || 
        !contentStrategy.frequency || !contentStrategy.platforms) {
      return res.status(400).json({ error: 'Faltan campos requeridos en la estrategia de contenido.' });
    }

    const prompt = `Soy un entrenador personal y he recopilado la siguiente información para mi estrategia de contenidos:

1. **¿Cuál es el principal objetivo de tu estrategia de contenidos?**
   - ${contentStrategy.objective}

2. **¿Qué tipos de contenido prefieres crear?**
   - ${contentStrategy.contentTypes.join('\n- ')}

3. **¿Con qué frecuencia planeas publicar contenido?**
   - ${contentStrategy.frequency}

4. **¿Qué plataformas de distribución utilizas principalmente?**
   - ${contentStrategy.platforms.join('\n- ')}

Con base en esta información, por favor genera un plan de contenidos detallado que incluya:

- **Temas Sugeridos:** Proporciona una lista de temas específicos para cada tipo de contenido seleccionado.
- **Calendario de Publicaciones:** Crea un calendario semanal que indique qué tipo de contenido publicar en cada día y en qué plataforma.
- **Estrategias de Engagement:** Ofrece tácticas específicas para aumentar la interacción y el compromiso en cada plataforma seleccionada.
- **Recomendaciones Adicionales:** Incluye sugerencias para optimizar la estrategia, como colaboraciones, uso de hashtags, herramientas de programación de contenido, y métricas clave para monitorear el éxito.

El plan debe estar estructurado en secciones claras y utilizar un formato de fácil lectura, preferiblemente en markdown, con encabezados, listas y viñetas para organizar la información de manera coherente. Asegúrate de que las ideas sean prácticas y accionables, facilitando la implementación de la estrategia para mejorar mi presencia en línea y captar nuevos clientes de manera efectiva.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en marketing digital y estrategia de contenidos para entrenadores personales. Tu objetivo es crear planes de contenido detallados y accionables que ayuden a los entrenadores a crecer su presencia en línea y atraer nuevos clientes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      n: 1
    });

    const contentPlan = completion.choices[0].message.content.trim();

    res.json({
      timestamp: new Date().toISOString(),
      contentPlan,
      status: 'completed',
      version: '1.0'
    });

  } catch (error) {
    console.error('\n=== ERROR EN EL PROCESAMIENTO DE ESTRATEGIA DE CONTENIDO ===');
    console.error('Error:', error);
    
    res.status(500).json({ 
      error: 'Error al generar el plan de contenido.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
