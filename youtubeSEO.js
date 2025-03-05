
import { optimizeSEO } from "./geminiService.js";

export async function analyzeSEO(videoId, videoDetails) {
    try {
        const [optimizedTitle, optimizedDescription, optimizedTags] = await optimizeSEO(
            videoDetails.title,
            videoDetails.description,
            videoDetails.tags
        );

        return {
            title: videoDetails.title,
            description: videoDetails.description,
            tags: videoDetails.tags,
            optimizedTitle,
            optimizedDescription,
            optimizedTags: optimizedTags.split(", "), // Convert string to an array
            seoScore: 90 // Placeholder SEO score
        };
    } catch (error) {
        console.error("Error analyzing SEO:", error);
        throw new Error("SEO analysis failed.");
    }
}
