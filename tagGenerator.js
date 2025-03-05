import axios from "axios";
import googleTrends from "google-trends-api";
import { fetchVideoDetails, getCategoryName } from "./youtubeService.js";

const YOUTUBE_API_KEY = "AIzaSyC2nBz0r52msVd1bU_GveLxvvUOBb7Dw4s";

// ✅ Get Trending Tags Based on Category
export async function getTrendingTags() {
    try {
        const results = await googleTrends.dailyTrends({ geo: "US" });
        const parsedResults = JSON.parse(results);

        // console.log("🔍 Google Trends API Response:", parsedResults);

        if (!parsedResults.default || !parsedResults.default.trendingSearchesDays) {
            console.error("⚠️ Google Trends API response format has changed.");
            return [];
        }

        const trends = parsedResults.default.trendingSearchesDays[0]?.trendingSearches || [];
        const extractedTags = trends.map(trend => trend.title).slice(0, 30); // ✅ Extract & Limit to 30
        // console.log("📢 Trending Data Received:", JSON.stringify(parsedResults, null, 2));

        // console.log("📈 Extracted Trending Tags:", extractedTags);
        return extractedTags;
    } catch (error) {
        // console.error("❌ Error fetching trending tags:", error.message);
        return [];
    }
}
export async function getChannelTags(channelTitle) {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(channelTitle)}&key=${YOUTUBE_API_KEY}&maxResults=5`;

    try {
        const searchResponse = await axios.get(searchUrl);
        const videoIds = searchResponse.data.items.map(video => video.id.videoId).filter(Boolean); // Ensure valid IDs

        // console.log("🔍 Video IDs Found:", videoIds);
        if (videoIds.length === 0) {
            console.error("⚠️ No videos found for channel:", channelTitle);
            return [];
        }

        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`;
        const detailsResponse = await axios.get(detailsUrl);

        const videoTags = detailsResponse.data.items
            .map(video => video.snippet?.tags || []) // Use optional chaining to avoid errors
            .flat()
            .filter(tag => tag.length > 1); // Remove empty tags

            // console.log("🛠️ Full API Response:", JSON.stringify(detailsResponse.data, null, 2));


        // If no tags, try generating AI-based tags
        if (videoTags.length === 0) {
            // console.warn("⚠️ No tags found! Trying Gemini AI...");
            return generateAIEnhancedTags(channelTitle);
        }

        return [...new Set(videoTags)].slice(0, 30); // Remove duplicates, limit to 30 tags
    } catch (error) {
        // console.error("❌ Error fetching channel tags:", error.message);
        return [];
    }
}export async function generateTags(videoId) {
    const videoDetails = await fetchVideoDetails(videoId);
    if (!videoDetails) throw new Error("Video details not found!");

    // console.log("🎥 Video Details:", videoDetails);

    let tags = Array.isArray(videoDetails.tags) ? videoDetails.tags : [];
    // console.log("📌 Existing Video Tags:", tags);

    if (tags.length === 0) {
        // console.log("❌ No tags found in video details, trying alternative sources...");

        const categoryName = getCategoryName(videoDetails.categoryId);
        const trendingTags = await getTrendingTags();
        const channelTags = await getChannelTags(videoDetails.channelTitle);

        const safeTrendingTags = Array.isArray(trendingTags) ? trendingTags : [];
        const safeChannelTags = Array.isArray(channelTags) ? channelTags : [];

        tags = [...new Set([...safeTrendingTags, ...safeChannelTags])].slice(0, 50);
        // console.log("🚀 Generated Tags from YouTube & Google:", tags);

        // ❌ If still empty, FORCE Gemini AI to generate tags
    
    }

    // console.log("✅ Final Tags:", tags);
    return tags.length > 0 ? tags : ["YouTube", "Viral Video", "Trending"]; // Fallback default tags
}
