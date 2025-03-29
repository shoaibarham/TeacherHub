import { 
  users, type User, type InsertUser, 
  content, type Content, type InsertContent,
  topicSuggestion, type TopicSuggestion, type InsertTopicSuggestion
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Content operations
  createContent(contentData: InsertContent): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  getContentByUser(userId: number): Promise<Content[]>;
  updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: number): Promise<boolean>;
  
  // Topic suggestion operations
  createTopicSuggestion(suggestion: InsertTopicSuggestion): Promise<TopicSuggestion>;
  getTopicSuggestions(subject: string, grade: string, limit?: number): Promise<TopicSuggestion[]>;
  deleteTopicSuggestion(id: number): Promise<boolean>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private content: Map<number, Content>;
  private topicSuggestions: Map<number, TopicSuggestion>;
  
  userIdCounter: number;
  contentIdCounter: number;
  topicSuggestionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.topicSuggestions = new Map();
    
    this.userIdCounter = 1;
    this.contentIdCounter = 1;
    this.topicSuggestionIdCounter = 1;
    
    // Add a dummy user for testing
    this.createUser({
      username: "teacher",
      password: "password"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Content operations
  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.contentIdCounter++;
    const newContent: Content = { ...insertContent, id };
    this.content.set(id, newContent);
    return newContent;
  }
  
  async getContent(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }
  
  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }
  
  async getContentByUser(userId: number): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.createdById === userId
    );
  }
  
  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined> {
    const existingContent = this.content.get(id);
    
    if (!existingContent) {
      return undefined;
    }
    
    const updatedContent: Content = {
      ...existingContent,
      ...contentData,
    };
    
    this.content.set(id, updatedContent);
    return updatedContent;
  }
  
  async deleteContent(id: number): Promise<boolean> {
    return this.content.delete(id);
  }
  
  // Topic suggestion operations
  async createTopicSuggestion(suggestion: InsertTopicSuggestion): Promise<TopicSuggestion> {
    const id = this.topicSuggestionIdCounter++;
    const newSuggestion: TopicSuggestion = { ...suggestion, id };
    this.topicSuggestions.set(id, newSuggestion);
    return newSuggestion;
  }
  
  async getTopicSuggestions(subject: string, grade: string, limit: number = 10): Promise<TopicSuggestion[]> {
    return Array.from(this.topicSuggestions.values())
      .filter(suggestion => 
        suggestion.subject === subject && 
        suggestion.grade === grade
      )
      .slice(0, limit);
  }
  
  async deleteTopicSuggestion(id: number): Promise<boolean> {
    return this.topicSuggestions.delete(id);
  }
}

// Export a single instance of storage
export const storage = new MemStorage();
