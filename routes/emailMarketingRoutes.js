const express = require("express");
const router = express.Router();
const emailMarketingController = require("../controllers/emailMarketingController");
console.log(emailMarketingController); // Agrega este log temporal para inspeccionar las funciones

// Asegúrate de que estas funciones estén correctamente exportadas en el controlador
router.post("/campaigns", emailMarketingController.createCampaign); // Crear una nueva campaña
router.put("/campaigns/:id", emailMarketingController.editCampaign); // Editar una campaña
router.delete("/campaigns/:id", emailMarketingController.deleteCampaign); // Eliminar una campaña
router.get("/campaigns/:campaignId/metrics", emailMarketingController.syncAllMetrics); // Obtener métricas de una campaña
router.get("/campaigns", emailMarketingController.listAndSyncCampaigns); // Listar y sincronizar campañas

module.exports = router;
