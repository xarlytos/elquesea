const mongoose = require("mongoose");

const emailMarketingSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["scheduled", "sent", "failed"], 
    default: "scheduled" 
  },
  openRate: { type: Number, default: 0 }, // %
  clickRate: { type: Number, default: 0 }, // %
  bounces: { type: Number, default: 0 },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
}, { timestamps: true });

module.exports = mongoose.model("EmailMarketing", emailMarketingSchema);
