const welcomeEmailTemplate = (clientName, trainerName) => {
    return {
        subject: '¡Bienvenido a tu nuevo programa de entrenamiento!',
        htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">¡Bienvenido ${clientName}!</h1>
                <p>Nos complace darte la bienvenida a tu nuevo programa de entrenamiento personalizado con ${trainerName}.</p>
                
                <h2 style="color: #444;">¿Qué sigue ahora?</h2>
                <ul>
                    <li>Tu entrenador se pondrá en contacto contigo pronto para comenzar</li>
                    <li>Recibirás acceso a tu plan de entrenamiento personalizado</li>
                    <li>Podrás comenzar a trackear tu progreso</li>
                </ul>
                
                <p>Si tienes alguna pregunta, no dudes en contactar con tu entrenador.</p>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Consejos para comenzar:</strong></p>
                    <ul>
                        <li>Completa tu perfil con toda tu información</li>
                        <li>Revisa tu plan de entrenamiento cuando esté disponible</li>
                        <li>Mantén una comunicación constante con tu entrenador</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">¡Esperamos que disfrutes de tu experiencia!</p>
            </div>
        `,
        textBody: `
¡Bienvenido ${clientName}!

Nos complace darte la bienvenida a tu nuevo programa de entrenamiento personalizado con ${trainerName}.

¿Qué sigue ahora?
- Tu entrenador se pondrá en contacto contigo pronto para comenzar
- Recibirás acceso a tu plan de entrenamiento personalizado
- Podrás comenzar a trackear tu progreso

Si tienes alguna pregunta, no dudes en contactar con tu entrenador.

Consejos para comenzar:
- Completa tu perfil con toda tu información
- Revisa tu plan de entrenamiento cuando esté disponible
- Mantén una comunicación constante con tu entrenador

¡Esperamos que disfrutes de tu experiencia!
        `
    };
};

const birthdayEmailTemplate = (clientName, trainerName) => {
    return {
        subject: '¡Feliz Cumpleaños! 🎉',
        htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h1 style="color: #ff4081; text-align: center;">🎈 ¡Feliz Cumpleaños ${clientName}! 🎈</h1>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <p style="font-size: 18px; color: #333;">
                            En este día tan especial, queremos desearte un cumpleaños lleno de alegría, 
                            salud y éxitos. Gracias por permitirnos ser parte de tu camino hacia tus objetivos.
                        </p>
                    </div>

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #666; font-size: 16px;">
                            "El éxito no es un accidente. Es trabajo duro, perseverancia, aprendizaje, 
                            estudio, sacrificio y, sobre todo, amor por lo que estás haciendo."
                        </p>
                    </div>

                    <p style="color: #333; text-align: center; margin-top: 30px;">
                        Sigue adelante con la misma dedicación y entusiasmo. ¡Estamos aquí para apoyarte!
                    </p>

                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #666;">
                            Con los mejores deseos,<br>
                            <strong style="color: #333;">${trainerName}</strong>
                        </p>
                    </div>
                </div>
            </div>
        `,
        textBody: `
¡Feliz Cumpleaños ${clientName}! 🎉

En este día tan especial, queremos desearte un cumpleaños lleno de alegría, salud y éxitos. 
Gracias por permitirnos ser parte de tu camino hacia tus objetivos.

"El éxito no es un accidente. Es trabajo duro, perseverancia, aprendizaje, estudio, sacrificio y, 
sobre todo, amor por lo que estás haciendo."

Sigue adelante con la misma dedicación y entusiasmo. ¡Estamos aquí para apoyarte!

Con los mejores deseos,
${trainerName}
        `
    };
};

const tipEmailTemplate = (clientName, trainerName, tipContent, campaignName) => {
    return {
        subject: `💡 Consejo del día - ${campaignName}`,
        htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #2196f3; margin-bottom: 20px;">Hola ${clientName},</h2>
                    
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1976d2; margin-top: 0;">💡 Consejo del día</h3>
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">
                            ${tipContent}
                        </p>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">
                            Este consejo es parte de la serie "${campaignName}".<br>
                            Seguirás recibiendo más consejos útiles para ayudarte en tu camino.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #666;">
                            Saludos,<br>
                            <strong style="color: #333;">${trainerName}</strong>
                        </p>
                    </div>
                </div>
            </div>
        `,
        textBody: `
Hola ${clientName},

💡 Consejo del día:

${tipContent}

Este consejo es parte de la serie "${campaignName}".
Seguirás recibiendo más consejos útiles para ayudarte en tu camino.

Saludos,
${trainerName}
        `
    };
};

module.exports = {
    welcomeEmailTemplate,
    birthdayEmailTemplate,
    tipEmailTemplate
};
