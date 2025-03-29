import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Send, FileText, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (content: string) => void;
  subjectContext?: string;
  gradeContext?: string;
}

export function AIAssistant({
  isOpen,
  onClose,
  onInsertContent,
  subjectContext,
  gradeContext,
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState('custom-prompt');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt is required",
        description: "Please enter a prompt for the AI assistant.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // This would be replaced with an actual API call to generate content
      // For now, we'll simulate a response with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample generated content
      const content = `<h2>Generated Content for "${prompt}"</h2>
      <p>This is where the AI-generated content would appear. In a production environment, this would be generated based on your prompt using Gemini AI.</p>
      <ul>
        <li>Key point 1 related to your query</li>
        <li>Key point 2 related to your query</li>
        <li>Key point 3 related to your query</li>
      </ul>
      <p>Additional paragraph with more information...</p>`;
      
      setGeneratedContent(content);
      toast({
        title: "Content generated",
        description: "AI has generated content based on your prompt.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsertContent(generatedContent);
      toast({
        title: "Content inserted",
        description: "AI-generated content has been inserted into your document.",
      });
      onClose();
    }
  };

  const setPresetPrompt = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Content Assistant
          </DialogTitle>
          <DialogDescription>
            Use AI to generate content or enhance your existing material.
            {subjectContext && gradeContext && (
              <span className="block mt-1 text-sm text-primary">
                Context: {subjectContext} for {gradeContext} students
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="custom-prompt">Custom Prompt</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="enhancements">Enhancements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="custom-prompt" className="space-y-4 mt-4">
            <div>
              <Textarea
                ref={textareaRef}
                placeholder="Enter a prompt for the AI (e.g., 'Write an introduction about photosynthesis for 6th grade students')"
                value={prompt}
                onChange={handlePromptChange}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="border p-4 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => {
                  const prompt = `Create a detailed lesson plan for ${subjectContext || 'Math'} on the topic of equations for ${gradeContext || '8th grade'} students. Include objectives, key concepts, examples, and practice activities.`;
                  setPresetPrompt(prompt);
                  setActiveTab('custom-prompt');
                }}
              >
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-medium">Lesson Plan</h3>
                </div>
                <p className="text-sm text-neutral-600">Complete lesson plan with objectives, content, and activities</p>
              </div>
              
              <div 
                className="border p-4 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => {
                  const prompt = `Generate a 10-question quiz about ${subjectContext || 'Science'} for ${gradeContext || '7th grade'} students, focusing on key concepts. Include a mix of multiple choice and short answer questions.`;
                  setPresetPrompt(prompt);
                  setActiveTab('custom-prompt');
                }}
              >
                <div className="flex items-center mb-2">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-medium">Quiz Generator</h3>
                </div>
                <p className="text-sm text-neutral-600">10-question assessment with mixed question types</p>
              </div>
              
              <div 
                className="border p-4 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => {
                  const prompt = `Create a student handout explaining ${subjectContext || 'History'} concepts for ${gradeContext || '10th grade'} students. Include key terminology, examples, and visual elements.`;
                  setPresetPrompt(prompt);
                  setActiveTab('custom-prompt');
                }}
              >
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-medium">Student Handout</h3>
                </div>
                <p className="text-sm text-neutral-600">Educational handout with key concepts and examples</p>
              </div>
              
              <div 
                className="border p-4 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => {
                  const prompt = `Generate a detailed concept explanation about ${subjectContext || 'English'} for ${gradeContext || '9th grade'} students. Break down complex ideas into simple terms with relevant examples.`;
                  setPresetPrompt(prompt);
                  setActiveTab('custom-prompt');
                }}
              >
                <div className="flex items-center mb-2">
                  <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-medium">Concept Explanation</h3>
                </div>
                <p className="text-sm text-neutral-600">Detailed breakdown of complex topics with examples</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="enhancements" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Content to Enhance</label>
                <Textarea
                  placeholder="Paste your existing content here to improve or modify it..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Simplify Language
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Add Examples
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Make More Engaging
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fix Grammar
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance Content
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {generatedContent && (
          <div className="mt-6 border rounded-md p-4 bg-neutral-50">
            <h3 className="text-sm font-medium mb-2">Generated Content</h3>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="sm:mr-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleInsert} 
            disabled={!generatedContent}
            className="flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            Insert into Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}