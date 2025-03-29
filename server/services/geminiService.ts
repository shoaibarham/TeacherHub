import { GoogleGenerativeAI } from "@google/generative-ai";
import { TopicSuggestion } from "@shared/schema";

// Initialize the Gemini API with environment variable
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY as string;
if (!API_KEY) {
  console.error("GOOGLE_GEMINI_API_KEY environment variable is not set");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Access the Gemini model (using gemini-1.5-flash for now)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface TopicSuggestionInput {
  subject: string;
  grade: string;
  count: number;
}

export async function generateTopicSuggestions(input: TopicSuggestionInput): Promise<Omit<TopicSuggestion, "id">[]> {
  try {
    const { subject, grade, count } = input;
    
    console.log(`Generating ${count} topic suggestions for ${subject} class (${grade} grade)`);
    console.log(`Using Gemini model: gemini-1.5-flash with API key: ${API_KEY.substring(0, 5)}...`);
    
    // Create a prompt for Gemini AI to generate educational topic suggestions
    const prompt = `Generate ${count} educational topic suggestions for ${subject} class for ${grade} students. 
    Each suggestion should include a title, detailed description, subject category, and appropriate difficulty levels.
    Format as a JSON array with the following structure for each suggestion:
    {
      "title": "Topic Title",
      "description": "Detailed description of the educational topic",
      "subject": "${subject}",
      "grade": "${grade}",
      "category": "Subject category or sub-area",
      "difficultyLevels": ["easy", "medium", "hard"] - (Include only appropriate levels)
    }
    Only return valid JSON without any other text or explanation.`;

    console.log("Sending prompt to Gemini API...");
    
    // Send the prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received response from Gemini, processing...");
    
    try {
      // Parse the response as JSON
      const jsonStr = text.replace(/```json|```/g, '').trim();
      console.log("Cleaned response:", jsonStr.substring(0, 100) + "...");
      
      const suggestions = JSON.parse(jsonStr) as Array<Omit<TopicSuggestion, "id">>;
      console.log(`Successfully parsed ${suggestions.length} suggestions`);
      
      const formattedSuggestions = suggestions.slice(0, count).map(suggestion => ({
        title: suggestion.title,
        description: suggestion.description,
        subject: subject,
        grade: grade,
        category: suggestion.category || subject,
        difficultyLevels: suggestion.difficultyLevels || ["medium"]
      }));
      
      console.log("Returning formatted suggestions:", formattedSuggestions.length);
      return formattedSuggestions;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.log("Raw response:", text);
      throw new Error("Failed to parse AI-generated suggestions");
    }
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    console.error("Error details:", JSON.stringify(error));
    throw error;
  }
}