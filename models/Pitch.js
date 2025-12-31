const mongoose = require("mongoose");

const pitchSchema = new mongoose.Schema({
  startupName: { type: String, required: true },
  founderName: { type: String, required: true },
  email: { type: String, required: true },
  idea: { type: String, required: true },
  funding: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pitch", pitchSchema);
