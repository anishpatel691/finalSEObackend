import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import seoRoutes from "./seoRoutes.js";
import { extractVideoId, fetchVideoDetails } from "./youtubeService.js";
import { optimizeSEO, generateRandomHashtags } from "./geminiService.js";
import Video from "./model/Video.js"; // MongoDB model
import Admin from "./model/Admin.js";
import dotenv from "dotenv";

const app = express();

dotenv.config({
    path: './.env'
})

// Middleware
app.use(express.json());
app.use(cors({
  origin: "https://final-seo-ghgo.vercel.app",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));


app.use(cors({ origin: "https://final-seo-ghgo.vercel.app" }));


app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection (✅ Replace with your actual MongoDB URI)
const MONGO_URI = process.env.MONGOODB_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes


app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.json({ success: false, message: "Invalid username" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    const lastLoginTime = admin.lastLogin; // Store previous login time

    // ✅ Update login time
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      username: admin.username,
      lastLogin: lastLoginTime || null,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all submited VideosUrl
app.get('/api/admin/videos', async (req, res) => {
  const videos = await Video.find({});
  res.json(videos);
});

app.patch('/api/admin/videos/:id/share', async (req, res) => {
  const { platform } = req.body;
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: "Video not found" });

  video.shared[platform] = !video.shared[platform];
  await video.save();
  res.json(video);
});


// Save video URL
app.post("/api/save-video", async (req, res) => {
  const { url } = req.body;
  console.log(`Analyzing URL: ${url}`);

  
  try {
    if (!url) return res.status(400).json({ error: "URL is required" });

    // Check if already exists
    const exists = await Video.findOne({ url });
    if (exists) return res.status(200).json({ message: "Already saved." });

    // Save new entry
    const newVideo = new Video({
      url,
      shared: {
        facebook: false,
        instagram: false,
        whatsapp: false,
        twitter: false
      }
    });

    await newVideo.save();
    res.status(201).json({ message: "Video URL saved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});




app.post("/api/analyze-seo", async (req, res) => {
  try {
    const { url } = req.body;
    console.log(`Analyzing URL: ${url}`);

    const videoId = extractVideoId(url);
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    const isShorts = url.includes("/shorts/");
    const details = await fetchVideoDetails(videoId);

    let tags = Array.isArray(details.tags) ? details.tags : [];

    if (tags.length === 0) {
      try {
        const generatedTags = await generateTags(videoId); // Make sure to import or define this
        tags = Array.isArray(generatedTags) ? generatedTags : [];
      } catch (err) {
        console.warn("⚠️ Error fetching trending tags:", err.message);
        tags = [];
      }
    }

    const optimized = await optimizeSEO(
      details.title,
      details.description,
      tags,
      details.language,
      details.categoryId,
      isShorts
    );

    const optimizedTitles =
      Array.isArray(optimized) && optimized.length >= 3
        ? optimized.slice(0, 3)
        : [details.title];

    const optimizedDescription = optimized[1] || details.description;
    const optimizedTags = Array.isArray(optimized[2]) ? optimized[2] : tags;
    const optimizedHasTags = Array.isArray(optimized[3]) ? optimized[3] : [];
    const optimizedRendomHashtags = generateRandomHashtags(details.categoryId);

    res.json({
      title: details.title,
      description: details.description,
      tags,
      optimizedTitles,
      optimizedDescription,
      optimizedTags,
      optimizedHasTags,
      randomHashtags: optimizedRendomHashtags,
      seoScore: Math.floor(Math.random() * 20) + 80,
    });
  } catch (error) {
    console.error("❌ Error in /api/analyze-seo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/api/users/register", (req, res) => {
  const { username, password } = req.body;
  console.log("✅ New Registration:", username);
  res.json({ message: "User registered (mock response)", username });
});

const PORT = process.env.PORT || 3098;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
