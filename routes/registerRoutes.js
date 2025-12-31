const express = require("express");
const router = express.Router();
const Register = require("../models/register"); 

router.post("/register", async (req, res) => {
  try {
    console.log("📩 Register Data:", req.body); // DEBUG

    const newRegister = new Register({
      fullName: req.body.fullName,
      email: req.body.email,
      startupName: req.body.startupName,
    });

    await newRegister.save(); 

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;




