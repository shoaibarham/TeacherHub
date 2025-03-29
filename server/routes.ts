import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertTopicSuggestionSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateTopicSuggestions } from "./services/geminiService";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- Content Management Routes ---
  
  // Create new content
  app.post("/api/content", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = insertContentSchema.parse(req.body);
      
      // Create the content
      const newContent = await storage.createContent(validatedData);
      
      res.status(201).json(newContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create content" });
      }
    }
  });
  
  // Get all content
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      let contentList;
      if (userId) {
        contentList = await storage.getContentByUser(userId);
      } else {
        contentList = await storage.getAllContent();
      }
      
      res.json(contentList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  
  // Get content by ID
  app.get("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const content = await storage.getContent(id);
      
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });
  
  // Update content
  app.patch("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      // Validate request body against schema
      const validatedData = insertContentSchema.partial().parse(req.body);
      
      const updatedContent = await storage.updateContent(id, validatedData);
      
      if (!updatedContent) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to update content" });
      }
    }
  });
  
  // Delete content
  app.delete("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteContent(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });
  
  // --- Topic Suggestion Routes ---
  
  // Create topic suggestion
  app.post("/api/suggestions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTopicSuggestionSchema.parse(req.body);
      
      const newSuggestion = await storage.createTopicSuggestion(validatedData);
      
      res.status(201).json(newSuggestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create topic suggestion" });
      }
    }
  });
  
  // Get topic suggestions by subject and grade
  app.get("/api/suggestions", async (req: Request, res: Response) => {
    try {
      const subject = req.query.subject as string;
      const grade = req.query.grade as string;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      
      if (!subject || !grade) {
        return res.status(400).json({ error: "Subject and grade are required" });
      }
      
      const suggestions = await storage.getTopicSuggestions(subject, grade, limit);
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topic suggestions" });
    }
  });
  
  // Delete a topic suggestion
  app.delete("/api/suggestions/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteTopicSuggestion(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Topic suggestion not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topic suggestion" });
    }
  });
  
  // --- AI Integration Route ---
  
  // Generate topic suggestions with Google Gemini AI
  app.post("/api/ai/suggestions", async (req: Request, res: Response) => {
    try {
      const { subject, grade, count = 3 } = req.body;
      
      if (!subject || !grade) {
        return res.status(400).json({ error: "Subject and grade are required" });
      }
      
      // Call the Gemini AI service to generate educational topic suggestions
      const generatedSuggestions = await generateTopicSuggestions({
        subject,
        grade,
        count: Number(count)
      });
      
      // Save suggestions to storage
      const savedSuggestions = await Promise.all(
        generatedSuggestions.map(suggestion => storage.createTopicSuggestion(suggestion))
      );
      
      res.json({ suggestions: savedSuggestions });
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      res.status(500).json({ error: "Failed to generate AI suggestions with Gemini" });
    }
  });
  
  // Generate content with Google Gemini AI
  app.post("/api/ai/content", async (req: Request, res: Response) => {
    try {
      const { prompt, subject, grade } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      // Get the Gemini API key
      const API_KEY = process.env.GOOGLE_GEMINI_API_KEY as string;
      if (!API_KEY) {
        return res.status(500).json({ error: "AI API key is not configured" });
      }
      
      try {
        console.log(`Generating content with prompt: "${prompt.substring(0, 50)}..."`);
        console.log(`Context: Subject=${subject || 'N/A'}, Grade=${grade || 'N/A'}`);
        
        // Import the Gemini library
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Enhance the prompt with context information if available
        let enhancedPrompt = prompt;
        if (subject || grade) {
          enhancedPrompt = `Generate educational content for ${grade || 'students'} about ${subject || 'the topic'} based on this prompt: ${prompt}. 
          Format the response as HTML with appropriate headings, paragraphs, lists, and emphasis for key points. 
          Make it educational, engaging, and appropriate for the specified grade level.`;
        } else {
          enhancedPrompt = `Generate educational content based on this prompt: ${prompt}. 
          Format the response as HTML with appropriate headings, paragraphs, lists, and emphasis for key points.`;
        }
        
        console.log("Sending enhanced prompt to Gemini API...");
        
        // Send the prompt to Gemini
        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Received response from Gemini, processing...");
        
        // Format the response as HTML with proper tags if needed
        let formattedContent = text;
        
        // If the response doesn't already include HTML tags, wrap it in basic HTML
        if (!formattedContent.includes('<h1>') && !formattedContent.includes('<h2>') && 
            !formattedContent.includes('<p>') && !formattedContent.includes('<ul>')) {
          formattedContent = `<h2>${prompt}</h2>
          ${formattedContent.split('\n\n').map(para => `<p>${para}</p>`).join('')}`;
        }
        
        res.status(200).json({ content: formattedContent });
      } catch (error) {
        console.error("Error generating AI content:", error);
        res.status(500).json({ error: "Failed to generate AI content" });
      }
    } catch (error) {
      console.error("Error in /api/ai/content:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
