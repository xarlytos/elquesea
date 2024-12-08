const EmailMarketing = require("../models/EmailMarketing");
const axios = require("axios");
const schedule = require("node-schedule");

// Configuración de la clave API de Brevo
const BREVO_API_KEY = "Apiprueba"; // Reemplaza con tu clave de API de Brevo

// Configuración del cliente de Brevo
const brevoApi = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: { "api-key": BREVO_API_KEY },
});

/**
 * Crear una nueva campaña de marketing por correo electrónico.
 */
exports.createCampaign = async (req, res) => {
  try {
    const { subject, body, scheduledDate, trainer, client, lead } = req.body;

    // Crear la campaña en Brevo
    const brevoResponse = await brevoApi.post("/emailCampaigns", {
      name: `Campaign - ${subject}`,
      subject,
      sender: { email: "your-email@example.com" }, // Cambia esto por el correo del remitente
      htmlContent: body,
      scheduledAt: new Date(scheduledDate).toISOString(),
    });

    // Guardar la campaña en la base de datos
    const emailMarketing = await EmailMarketing.create({
      subject,
      body,
      scheduledDate,
      trainer,
      client,
      lead,
      status: "scheduled",
    });

    // Programar el envío
    schedule.scheduleJob(new Date(scheduledDate), async () => {
      try {
        // Enviar el email programado
        const sendResponse = await brevoApi.post(`/emailCampaigns/${brevoResponse.data.id}/sendNow`);
        console.log(`Campaña ${subject} enviada exitosamente`, sendResponse.data);
      } catch (error) {
        console.error(`Error al enviar la campaña ${subject}:`, error.message);
        await EmailMarketing.findByIdAndUpdate(emailMarketing._id, { status: "failed" });
      }
    });

    res.status(201).json({ message: "Campaign created and scheduled", emailMarketing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Editar una campaña existente antes de su envío.
 */
exports.editCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, scheduledDate } = req.body;

    // Actualizar en la base de datos
    const emailMarketing = await EmailMarketing.findByIdAndUpdate(
      id,
      { subject, body, scheduledDate },
      { new: true }
    );

    if (!emailMarketing) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Si hay cambios en la programación, actualizar la tarea
    if (scheduledDate) {
      schedule.cancelJob(emailMarketing._id.toString());
      schedule.scheduleJob(new Date(scheduledDate), async () => {
        try {
          const sendResponse = await brevoApi.post(`/emailCampaigns/${id}/sendNow`);
          console.log(`Campaña ${subject} enviada exitosamente`, sendResponse.data);
        } catch (error) {
          console.error(`Error al enviar la campaña ${subject}:`, error.message);
          await EmailMarketing.findByIdAndUpdate(emailMarketing._id, { status: "failed" });
        }
      });
    }

    res.status(200).json({ message: "Campaign updated", emailMarketing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancelar una campaña antes de su envío.
 */
exports.cancelCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const emailMarketing = await EmailMarketing.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!emailMarketing) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Cancelar tarea programada
    schedule.cancelJob(id);

    res.status(200).json({ message: "Campaign cancelled", emailMarketing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Sincronizar métricas para todas las campañas desde Brevo.
 */
exports.syncAllMetrics = async (req, res) => {
  try {
    const campaigns = await EmailMarketing.find({ status: "sent" });

    for (const campaign of campaigns) {
      try {
        const metrics = await brevoApi.get(`/emailCampaigns/${campaign._id}/statistics`);
        await EmailMarketing.findByIdAndUpdate(campaign._id, {
          openRate: metrics.data.statistics.openers,
          clickRate: metrics.data.statistics.clickers,
          bounces: metrics.data.statistics.hardBounces + metrics.data.statistics.softBounces,
        });
      } catch (error) {
        console.error(`Error al sincronizar métricas de la campaña ${campaign._id}:`, error.message);
      }
    }

    res.status(200).json({ message: "Metrics synced for all campaigns" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  
/**
 * Eliminar una campaña.
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const emailMarketing = await EmailMarketing.findByIdAndDelete(id);

    if (!emailMarketing) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Cancelar cualquier tarea programada asociada
    schedule.cancelJob(id);

    res.status(200).json({ message: "Campaign deleted", emailMarketing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.listAndSyncCampaigns = async (req, res) => {
    try {
      const brevoCampaigns = await brevoApi.get("/emailCampaigns");
      res.status(200).json({ campaigns: brevoCampaigns.data.campaigns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
