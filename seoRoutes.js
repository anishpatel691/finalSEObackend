import express from "express";
import { extractVideoId,fetchVideoDetails } from "./youtubeService.js";
import { optimizeSEO } from "./geminiService.js";
const router = express.Router();

// Analyze YouTube Video SEO
router.post("/analyze-seo", async (req, res) => {
  try {
    const { url } = req.body;
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const details = await fetchVideoDetails(videoId);
    const optimized = await optimizeSEO(
      details.title,
      details.description,
      details.tags || []
    );

    res.json({
      title: details.title,
      description: details.description,
      tags: details.tags || [],
      optimizedTitle: optimized[0],
      optimizedDescription: optimized[1],
      seoScore: 85, // Placeholder SEO score
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
