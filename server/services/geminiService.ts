import { GoogleGenerativeAI } from "@google/generative-ai";
import { TopicSuggestion } from "@shared/schema";

// Initialize the Gemini API with the provided key
const API_KEY = "AIzaSyDfSvQXOtHa0FAlkzyYVrqvql79510y1tM";
const genAI = new GoogleGenerativeAI(API_KEY);

// Access the Gemini 2.0 Flash model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface TopicSuggestionInput {
  subject: string;
  grade: string;
  count: number;
}

export async function generateTopicSuggestions(input: TopicSuggestionInput): Promise<Omit<TopicSuggestion, "id">[]> {
  try {
    const { subject, grade, count } = input;
    
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

    // Send the prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Parse the response as JSON
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const suggestions = JSON.parse(jsonStr) as Array<Omit<TopicSuggestion, "id">>;
      
      return suggestions.slice(0, count).map(suggestion => ({
        title: suggestion.title,
        description: suggestion.description,
        subject: subject,
        grade: grade,
        category: suggestion.category,
        difficultyLevels: suggestion.difficultyLevels
      }));
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.log("Raw response:", text);
      throw new Error("Failed to parse AI-generated suggestions");
    }
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    throw error;
  }
}