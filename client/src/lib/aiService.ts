import { apiRequest } from "./queryClient";
import { TopicSuggestionRequest, SuggestionResponse, InsertTopicSuggestion, TopicSuggestion } from "@shared/schema";

/**
 * Service to handle AI-related operations
 */
export const aiService = {
  /**
   * Generate topic suggestions using Google Gemini AI
   */
  generateSuggestions: async (request: TopicSuggestionRequest): Promise<SuggestionResponse> => {
    try {
      console.log('Generating AI suggestions for:', request);
      const response = await apiRequest('POST', '/api/ai/suggestions', request);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI suggestion generation failed:', errorText);
        throw new Error(`Failed to generate AI suggestions: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Successfully generated suggestions:', result);
      return result;
    } catch (error) {
      console.error('Error in generateSuggestions:', error);
      throw error;
    }
  },
  
  /**
   * Get existing topic suggestions by subject and grade
   */
  getSuggestions: async (subject: string, grade: string, limit?: number): Promise<TopicSuggestion[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('subject', subject);
    queryParams.append('grade', grade);
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    try {
      console.log(`Fetching suggestions for ${subject} (${grade})`);
      const response = await fetch(`/api/suggestions?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch suggestions:', errorText);
        throw new Error(`Failed to fetch suggestions: ${response.status} ${response.statusText}`);
      }
      
      const suggestions = await response.json() as TopicSuggestion[];
      console.log(`Found ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      throw error;
    }
  }
};
