const express = require("express");
const Pitch = require("../models/Pitch");
const router = express.Router();

// POST: Submit a pitch
router.post("/submit-pitch", async (req, res) => {
  try {
    const newPitch = new Pitch(req.body);
    await newPitch.save();
    res.json({ success: true, message: "Pitch submitted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: View all pitches
router.get("/pitches", async (req, res) => {
  try {
    const pitches = await Pitch.find().sort({ createdAt: -1 });
    res.json(pitches);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
