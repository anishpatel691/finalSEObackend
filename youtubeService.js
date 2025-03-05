import axios from "axios";
import dotenv from "dotenv";
dotenv.config({
    path: './.env'
})


 const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;


export function extractVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/|v\/))([\w-]+)/);
    return match ? match[1] : null;
}



// Fetch Video Details from YouTube API
export async function fetchVideoDetails(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    try {
        const response = await axios.get(url);
        const video = response.data.items[0]?.snippet;
        const detectedLanguage = video.defaultAudioLanguage || video.defaultLanguage || "English"; // ✅ Detect language
// console.log("ytser",video);

        return video
            ? { title: video.title, description: video.description, tags: video.tags || [], categoryId: video.categoryId, channelTitle: video.channelTitle, language: detectedLanguage }
            : null;
    } catch (error) {
        console.error("❌ Error fetching video details:", error.message);
        throw new Error("Failed to fetch video details.");
    }
}

// Map Category ID to Name
export function getCategoryName(categoryId) {
    const categories = {
        1: "Film & Animation", 2: "Autos & Vehicles", 10: "Music", 15: "Pets & Animals",
        17: "Sports", 20: "Gaming", 22: "People & Blogs", 23: "Comedy", 24: "Entertainment",
        25: "News & Politics", 26: "How-to & Style", 27: "Education", 28: "Science & Technology",
        29: "Nonprofits & Activism"
    };
    return categories[categoryId] || "Unknown";
}
