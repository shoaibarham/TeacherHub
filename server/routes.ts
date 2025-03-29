import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertTopicSuggestionSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
      
      // This route would normally call the Gemini API, but for now we'll create mock suggestions
      // as we don't have an actual API key setup in this environment
      const suggestions = generateSampleSuggestions(subject, grade, count);
      
      // Save suggestions to storage
      const savedSuggestions = await Promise.all(
        suggestions.map(suggestion => storage.createTopicSuggestion(suggestion))
      );
      
      res.json({ suggestions: savedSuggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI suggestions" });
    }
  });

  return httpServer;
}

// Helper function to generate sample suggestions
// In a real implementation, this would be replaced with actual Gemini API calls
function generateSampleSuggestions(subject: string, grade: string, count: number) {
  const suggestions = [];
  
  const categories = {
    "Mathematics": ["Algebra", "Geometry", "Statistics", "Calculus"],
    "Science": ["Biology", "Chemistry", "Physics", "Earth Science"],
    "English": ["Literature", "Grammar", "Composition", "Rhetoric"],
    "History": ["Ancient", "Medieval", "Modern", "Contemporary"],
    "Geography": ["Physical", "Human", "Environmental", "Economic"]
  };
  
  const subjectCategories = categories[subject as keyof typeof categories] || ["General"];
  
  for (let i = 0; i < count; i++) {
    const categoryIndex = i % subjectCategories.length;
    const category = subjectCategories[categoryIndex];
    
    suggestions.push({
      title: `${category} Topic ${i + 1} for ${grade}`,
      description: `A comprehensive study of ${category.toLowerCase()} concepts suitable for ${grade} students.`,
      subject,
      grade,
      category,
      difficultyLevels: i % 3 === 0 
        ? ["easy", "medium"] 
        : i % 3 === 1 
          ? ["medium", "hard"] 
          : ["easy", "medium", "hard"]
    });
  }
  
  return suggestions;
}
