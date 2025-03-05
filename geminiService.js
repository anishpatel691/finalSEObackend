import axios from "axios";
import dotenv from "dotenv";
dotenv.config({
    path: './.env'
})
 const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


//Generate fallback tags based on video title and category
function generateRandomTags(title, category) {
    const defaultTags = [
        "Trending", "Popular", "Viral", "MustWatch", "TopVideo",
        "Exclusive", "Insane", "BestTips", "LatestNews", "Guide",
        "YouTubeGrowth", "AI", "Marketing", "MoneyTips", "Hacks"
    ];
    
    // Use keywords from title and category
    const titleWords = title.split(" ").slice(0, 3);
    const categoryWords = category ? category.split(" ") : [];
    
    // Merge and shuffle tags
    let randomTags = [...titleWords, ...categoryWords, ...defaultTags];
    randomTags = [...new Set(randomTags)]; // Remove duplicates
    return randomTags.slice(0, 10); // ✅ Return top 10 optimized tags
}

// Generate random hashtags based on video categorye
 export    function generateRandomHashtags(category) {
    const defaultHashtags = [
        "#Viral", "#Trending", "#MustWatch", "#Shorts", "#YouTubeGrowth",
        "#TechTips", "#AI", "#Marketing", "#MoneyTips", "#Hacks"
    ];
    
    const categoryHashtags = category
        ? [`#${category.replace(/\s+/g, '')}`, `#BestOf${category.replace(/\s+/g, '')}`]
        : [];
    
    let allHashtags = [...categoryHashtags, ...defaultHashtags];
    allHashtags = [...new Set(allHashtags)]; // Remove duplicates
    return allHashtags.slice(0, 60); // ✅ Return top 10 trending hashtags
}


export const optimizeSEO = async (title, description, tags, language = "English", categoryId, isShorts = false) => {
  const prompt = `
  Optimize the YouTube video SEO title **in ${language}**, occasionally mixing **Hindi** (not every time).

  📌 **Guidelines:**  
  - Keep titles **under 150 characters**, concise, and engaging Give  in 3 diffrent languages in hindi,english, and hinenglish [menans Hindi and english mixture].  
  - Use **real-time trending keywords, relevant tags, and high-visibility hashtags**.  
  - Consider **channel category, audience behavior, and latest trends** before optimizing.  
  - If it's a **YouTube Shorts**, include **#Shorts** in hashtags.  

  🎬 **Video Details:**  
  - **Title:** ${title}  
  - **Description:** ${description}  
  - **Tags:** ${tags.join(", ")}  
  - **Channel Title:** ${title}  
  - **Channel ID:** ${categoryId}  
  - **Is Shorts?** ${isShorts ? "Yes" : "No"}  
  - **Channel Language:** ${language}  

  🔍 **Hashtags & Tags Strategy:**  
  - Generate **40-60 trending, SEO-optimized, and category-relevant hashtags**.  
  - Tags should cover **core topics, related topics, and SEO-friendly search phrases**.  
  - Avoid banned, irrelevant, or ineffective hashtags.  

  🚀 **SEO Optimization Goals:**  
  1️⃣ **Generate 3 optimized titles** under 100 characters.  
  2️⃣ **Write a concise, keyword-rich, and engaging video description (100-300 words).**  
  3️⃣ **Suggest 60 SEO-friendly, dynamic tags (comma-separated).**  
  4️⃣ **Provide 40-60 trending hashtags (comma-separated, without '#').**  

  🎯 **Response Format:**  
  **Titles:** <Title 1>, <Title 2>, <Title 3>  
  **Description:** <Optimized 100-300 word description with trending hastag base on categoryId is ${categoryId}>  
  **Tags:** <Comma-separated 60 tags>  
  **Hashtags:** <Comma-separated 40-60 hashtags (without #)>
`;


  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );
  
    if (response.data && response.data.candidates) {
      const aiText = response.data.candidates[0].content.parts[0].text;
      
  console.log("Geminai ",aiText );
  const titlesMatch = aiText.match(/\*\*Titles:\*\*\s*([\s\S]+?)\n\s*\*\*/);
  let optimizedTitles = [];
 
// Extract only the titles section
// const titlesMatch = aiText.match(/\*\*Titles:\*\*\s*([\s\S]+?)\n\s*\*\*/);

let titlesArray = [];

if (titlesMatch && titlesMatch[1]) {
  titlesArray = titlesMatch[1]
    .trim()
    .split("\n") // Split by new lines
    .map(title => title.replace(/^\d+\.\s*/, "").trim()); // Remove numbering

  console.log("Extracted Titles:", titlesArray);
} else {
  console.log("No titles found.");
}
  if (titlesMatch) {
      const titleLines = titlesMatch[1]
          .split(/\d+\.\s*|\d+️⃣\s*/) // Improved regex to handle extra spaces
          .map(title => title.trim()) // Trim whitespace
          .filter(title => title.length > 0); // Remove empty strings
  
      console.log("🔍 Extracted Title Lines:", titleLines);
      console.log("🔄 Number of Titles Extracted:", titleLines.length);
  
      // Use a Set to remove duplicates
      const uniqueTitles = new Set();
      optimizedTitles = titleLines.filter(title => {
          const normalized = title
              .toLowerCase()
              .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, '') // Remove special characters
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
  
          if (!uniqueTitles.has(normalized)) {
              uniqueTitles.add(normalized);
              return true;
          }
          return false;
      });
  
      console.log("✅ Final Unique Titles:", optimizedTitles);
  }
  
  // Ensure at least 3 titles with a fallback
  const fallbackTitle = "Not Genereted Title.Try again";
  while (optimizedTitles.length < 3) {
      optimizedTitles.push(fallbackTitle);
  }
  
  // Keep only the top 3 unique titles
  optimizedTitles = optimizedTitles.slice(0, 3);
  
  // console.log("✅ Optimized Titles:", optimizedTitles);
  
     
  const descriptionMatch = aiText.match(/\*\*Description:\*\*\s*(.+)/s);
  let optimizedDescription = descriptionMatch ? descriptionMatch[1].trim() : description;
  
  if (optimizedDescription.length < 1000) {
    console.log("⚠️ Description is too short. Re-generating...");
  
    // Call AI again to regenerate a more detailed description
    optimizedDescription = optimizeSEO(); // Replace with actual AI call
  }
  
  console.log("✅ Optimized Description:", optimizedDescription);
  
            // 🔹 Extract optimized tags
            const tagsMatch = aiText.match(/\*\*Tags:\*\*\s*(.+)/);
            const optimizedTags = tagsMatch ? tagsMatch[1].split(",").map(tag => tag.trim()) : tags;
            // console.log("✅ Optimized Titles:", optimizedTitles);
            // console.log("✅ Optimized Description:", optimizedDescription);
            console.log("✅ Optimized Tags:", optimizedTags);
            // 🔹 Extract hashtags & format them with "#"
            // 🔹 Extract hashtags from AI response
const hashtagsMatch = aiText.match(/\*\*Hashtags:\*\*\s*(.+)/);
let optimizedHashtags = hashtagsMatch
    ? hashtagsMatch[1].split(",").map(tag => `#${tag.trim().replace(/\s+/g, '')}`)
    : [];

// 🎯 Ensure Shorts include Shorts-Specific Hashtags
if (isShorts) {
    const shortsHashtags = ["#Shorts", "#YTShorts", "#ShortsFeed", "#TrendingShorts"];
    
    // 🔹 Add Shorts hashtags ONLY if not already included
    shortsHashtags.forEach(tag => {
        if (!optimizedHashtags.includes(tag)) {
            optimizedHashtags.unshift(tag);
        }
    });
}

// 🎯 Ensure hashtags are properly formatted & remove duplicates
optimizedHashtags = [...new Set(optimizedHashtags)] // ✅ Removes duplicates
    .filter(tag => tag.length > 1) // ✅ Filters out empty hashtags
    .slice(0, 50); // ✅ Limits to 15 hashtags for best performance

console.log("✅ Optimized Hashtags:", optimizedHashtags);
return [optimizedTitles, optimizedDescription, optimizedTags, optimizedHashtags];

    } else {
      throw new Error("Unexpected response format from Gemini API.");
    }
  } catch (error) {
    console.error("Error generating SEO suggestions:", error.response?.data || error.message);
    return [
      [title],
      description,
      generateRandomTags(title, categoryId),
      generateRandomHashtags(categoryId)
  ];


  }
};
