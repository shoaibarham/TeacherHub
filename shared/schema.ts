import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (keeping existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Content types enum
export const ContentType = {
  NOTES: "notes",
  QUIZ: "quiz",
  ASSIGNMENT: "assignment",
  PAPER: "paper",
} as const;

export type ContentTypeValue = typeof ContentType[keyof typeof ContentType];

// Difficulty levels enum
export const DifficultyLevel = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export type DifficultyLevelValue = typeof DifficultyLevel[keyof typeof DifficultyLevel];

// Educational content table
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'notes', 'quiz', 'assignment', 'paper'
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  htmlContent: text("html_content").notNull(),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  createdById: integer("created_by_id").notNull(),
});

export const insertContentSchema = createInsertSchema(content)
  .omit({ id: true })
  .extend({
    type: z.enum([
      ContentType.NOTES, 
      ContentType.QUIZ, 
      ContentType.ASSIGNMENT, 
      ContentType.PAPER
    ]),
    difficulty: z.enum([
      DifficultyLevel.EASY, 
      DifficultyLevel.MEDIUM, 
      DifficultyLevel.HARD
    ]),
    tags: z.array(z.string()).optional(),
  });

// AI Topic suggestions
export const topicSuggestion = pgTable("topic_suggestion", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  category: text("category"),
  difficultyLevels: text("difficulty_levels").array(),
});

export const insertTopicSuggestionSchema = createInsertSchema(topicSuggestion).omit({
  id: true,
});

// Types for strong typing
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;  
export type Content = typeof content.$inferSelect;

export type InsertTopicSuggestion = z.infer<typeof insertTopicSuggestionSchema>;
export type TopicSuggestion = typeof topicSuggestion.$inferSelect;

// Types for Gemini API responses
export interface TopicSuggestionRequest {
  subject: string;
  grade: string;
  count?: number;
}

export interface SuggestionResponse {
  suggestions: TopicSuggestion[];
}
