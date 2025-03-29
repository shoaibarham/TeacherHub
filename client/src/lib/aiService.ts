import { apiRequest } from "./queryClient";
import { TopicSuggestionRequest, SuggestionResponse, InsertTopicSuggestion } from "@shared/schema";

/**
 * Service to handle AI-related operations
 */
export const aiService = {
  /**
   * Generate topic suggestions using Google Gemini AI
   */
  generateSuggestions: async (request: TopicSuggestionRequest): Promise<SuggestionResponse> => {
    const response = await apiRequest('POST', '/api/ai/suggestions', request);
    return response.json();
  },
  
  /**
   * Get existing topic suggestions by subject and grade
   */
  getSuggestions: async (subject: string, grade: string, limit?: number): Promise<InsertTopicSuggestion[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('subject', subject);
    queryParams.append('grade', grade);
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    const response = await fetch(`/api/suggestions?${queryParams.toString()}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    
    return response.json();
  }
};
