import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { MongoClient } from "mongodb";
import bodyParser from 'body-parser';
import seoRoutes from "./seoRoutes.js";
import { extractVideoId ,fetchVideoDetails } from "./youtubeService.js";
import { optimizeSEO } from "./geminiService.js";
import { log } from "console";
import { generateRandomHashtags } from "./geminiService.js";

const app = express();
app.use(express.json());  // Middleware to parse JSON data
const server = createServer(app);

app.use(cors({
  origin: "https://final-seo-ghgo.vercel.app", // Allow only your frontend
  methods: "GET,POST,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true
}));

app.post("/api/analyze-seo", async (req, res) => {
  try {
    const { url } = req.body;
    console.log(`Analyzing URL: ${url}`);

    // 1️⃣ Extract Video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }
    const isShorts = url.includes("/shorts/");
    // 2️⃣ Fetch Video Details from YouTube API
    const details = await fetchVideoDetails(videoId);
    // console.log("Video Details:", details);
    // 3️⃣ Generate Trending Tags (if no tags exist)
    let tags = details.tags;

    // ✅ Ensure `tags` is an array
    if (!Array.isArray(tags)) {
      tags = [];
    }

    // 3️⃣ Generate Trending Tags (if no tags exist)
    if (tags.length === 0) {
      try {
        const generatedTags = await generateTags(videoId);
        tags = Array.isArray(generatedTags) ? generatedTags : [];
      } catch (err) {
        console.warn("⚠️ Error fetching trending tags, using fallback:", err.message);
        tags = [];
      }
    }

    // 4️⃣ Optimize SEO using Gemini AI (Request multiple titles & hashtags)
    const optimized = await optimizeSEO(details.title, details.description, tags,details.language,details.categoryId,isShorts);
console.log("app.js",optimized[1]);

    // 🔹 Extract only the top 3 optimized titles
    const optimizedTitles = Array.isArray(optimized) && optimized.length >= 3 
      ? optimized.slice(0, 3)  // ✅ Only top 3 optimized titles
      : [details.title];  // ✅ Fallback to original title if missing
      // console.log("Optimized Data:", optimized.length ,optimized );

    // console.log("Top 3 Optimized Titles:", optimizedTitles);
   
    const optimizedDescription = optimized[1] || details.description;
const optimizedTags = optimized[2] && Array.isArray(optimized[2])
  ? optimized[2] 
  : tags; // ✅ Ensures `optimizedTags` is an array, falls back to original tags if missing
// console.log("Optimized RT Tags:", optimizedTags);
console.log("app.js",optimizedTags);

const optimizedRendomHashtags =  generateRandomHashtags(details.categoryId);
console.log("app.js",optimizedRendomHashtags);

const optimizedHasTags = optimized[3] && Array.isArray(optimized[3])
  ? optimized[3] 
  : []; 

// console.log("Generated Hashtags:", optimizedHashtags);

console.log("Optimized Data:", optimizedTitles,"DEs",optimizedDescription,"Tags",optimizedTags,optimizedHasTags);

    // 6️⃣ Send JSON Response
    res.json({
      title: details.title,
      description: details.description,
      tags,  // Original tags
      optimizedTitles, // ✅ Array of 3 optimized titles
      optimizedDescription, // ✅ Optimized description
      optimizedTags,
      optimizedHasTags, // ✅ Optimized tags array
   // ✅ Optimized hashtags
      seoScore: Math.floor(Math.random() * 20) + 80, // Random SEO Score (80-100)
    });

  } catch (error) {
    console.error("❌ Error in /api/analyze-seo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/api/users/register", (req, res) => {
  console.log("Hello There");
 const {username,password} =req.body();
console.log(username);
});
// WebSocket setup
io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.emit("wellcome", `Welcome to the server`);
  socket.broadcast.emit("wellcome", `${socket.id} joined the Socket server`);
  socket.on("message", async (data) => {
    console.log(data); // Logs the message data received
    console.log("Socket ID:", socket.id);
    const id = socket.id; // Logs the socket ID

    // Save the message to MongoDB
    try {
      const messageDocument = { message: data, socketId: id, timestamp: new Date() };
      await messagesCollection.insertOne(messageDocument);
      console.log("Message saved to MongoDB", messageDocument);
    } catch (error) {
      console.error("Failed to save message to MongoDB", error);
    }

    io.emit("recivemsg", { data, id }); // Broadcast the message to all clients with socket ID
  });

  // Optional: Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});
 const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server is running on port 3000");
  console.log("http://localhost:3000");
  console.log("http://localhost:3000/api/users/register");
  
}); 
