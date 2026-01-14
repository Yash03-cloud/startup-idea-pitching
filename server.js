// ---------------------- IMPORTS ----------------------
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();
const fetch = require('node-fetch');
const chatbotDataset = require('./data/chatbot_dataset.json');

// ---------------------- APP INIT ----------------------
const app = express();

// ---------------------- MIDDLEWARE ----------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname)));

// ---------------------- DATABASE ----------------------
mongoose
  .connect("mongodb://localhost:27017/")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ---------------------- SCHEMAS ----------------------

// USERS
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  email: String,
  password: String,
}));

// 🔥 PITCH (UPDATED WITH STATUS)
const Pitch = mongoose.model("Pitch", new mongoose.Schema({
  company_name: { type: String, required: true },
  founder_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  industry: { type: String, required: true },
  stage: { type: String, required: true },
  funding_amount: String,
  team_size: String,
  pitch_summary: { type: String, required: true },
  problem_statement: { type: String, required: true },
  solution: { type: String, required: true },
  target_market: { type: String, required: true },
  business_model: { type: String, required: true },
  competition: String,

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  submitted_at: { type: Date, default: Date.now },
}));

// OTHER MODELS
// INVESTMENT
const Investment = mongoose.model("Investment", new mongoose.Schema({
  startupName: String,
  name: String,
  email: String,
  amount: Number,
  message: String,
}, { timestamps: true }));

// COMMUNITY
const Community = mongoose.model("Community", new mongoose.Schema({
  name: String,
  email: String,
  organization: String,
  reason: String,
  joined_at: { type: Date, default: Date.now },
}));

const MentorContact = mongoose.model("MentorContact", new mongoose.Schema({
  name: String,
  email: String,
  profession: String,
  goal: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
}));

const Contact = mongoose.model("Contact", new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  submitted_at: { type: Date, default: Date.now },
}));

// ---------------------- AUTH ----------------------
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) return res.status(400).json({ message: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hash });
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).json({ message: "User not found" });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  res.json({ success: true, id: user._id, username: user.username });
});

// ---------------------- PITCH ROUTES ----------------------

// Submit pitch
app.post("/api/submit-pitch", async (req, res) => {
  await new Pitch(req.body).save();
  res.json({ success: true });
});

// 🔥 Get pitches (admin OR browse)
app.get("/api/pitches", async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const pitches = await Pitch.find(filter).sort({ submitted_at: -1 });
  res.json(pitches);
});

// 🔥 Accept / Reject
app.put("/api/pitches/:id", async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  await Pitch.findByIdAndUpdate(req.params.id, { status });
  res.json({ success: true });
});




// ---------------------- INVESTMENT ROUTES ----------------------
app.post("/api/invest", async (req, res) => {
  try {
    const inv = new Investment(req.body);
    await inv.save();
    res.json({ success: true, message: 'Investment saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get("/api/investments", async (req, res) => {
  try {
    const investments = await Investment.find().sort({ createdAt: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ---------------------- COMMUNITY ROUTES ----------------------
app.post("/api/community", async (req, res) => {
  try {
    const lead = new Community(req.body);
    await lead.save();
    res.json({ success: true, message: 'Community request saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get("/api/community-leads", async (req, res) => {
  try {
    const leads = await Community.find().sort({ joined_at: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ---------------------- LEADS ----------------------
// 👇 Mentor form submit yahin aa raha hai
app.post("/api/mentor-contact", async (req, res) => {
  try {
    await new MentorContact(req.body).save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/leads", async (req, res) => {
  const leads = await MentorContact.find().sort({ createdAt: -1 });
  res.json(leads);
});

// ---------------------- CONTACT ----------------------
app.post("/api/contact", async (req, res) => {
  await new Contact(req.body).save();
  res.json({ success: true });
});

// ---------------------- EMAIL ----------------------
app.post("/reserve", async (req, res) => {
  const { name, email, startup, role } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: `"Startup Events" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✅ Your Spot is Reserved!",
    html: `<h2>Hello ${name}</h2><p>Your spot is confirmed 🚀</p>`
  });

  res.json({ success: true });
});

// ---------------------- SERVER ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



app.get("/api/contact", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ submitted_at: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});




const demoSchema = new mongoose.Schema({
  founderName: { type: String, required: true },
  email: { type: String, required: true },
  startupName: { type: String, required: true },
  industry: { type: String, required: true },
  demoDescription: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now }
});

const DemoRegistration = mongoose.model("DemoRegistration", demoSchema);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Startup Demo Backend Running");
});

// Demo Registration API
app.post("/api/demo-register", async (req, res) => {
  try {
    const {
      founderName,
      email,
      startupName,
      industry,
      demoDescription
    } = req.body;

    if (!founderName || !email || !startupName || !industry || !demoDescription) {
      return res.status(400).json({ message: "All fields required" });
    }

    await DemoRegistration.create(req.body);

    res.status(201).json({
      success: true,
      message: "Demo registered successfully"
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- DEMO REGISTRATIONS ----------------------
app.get("/api/demo-registrations", async (req, res) => {
  try {
    const demos = await DemoRegistration.find().sort({ registeredAt: -1 });
    res.json(demos);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
