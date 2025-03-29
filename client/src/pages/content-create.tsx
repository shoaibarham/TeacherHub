import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RichTextEditor, { RichTextEditorRef } from "@/components/ui/rich-text-editor";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { FileText, BookOpen, FileCheck, FilePlus, RefreshCw, ArrowLeft, Sparkles } from "lucide-react";
import { 
  insertContentSchema, 
  ContentType, 
  DifficultyLevel,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { SUBJECTS, GRADES } from "@/lib/constants";

const formSchema = insertContentSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  tags: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContentCreate() {
  const [, navigate] = useLocation();
  const [activeContentType, setActiveContentType] = useState<string>(ContentType.NOTES);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: ContentType.NOTES,
      subject: "",
      grade: "",
      difficulty: DifficultyLevel.EASY,
      htmlContent: "",
      createdById: 1, // Hardcoded for now
      isPublic: false,
      tags: []
    }
  });
  
  const contentTypesInfo = [
    { id: ContentType.NOTES, label: 'Notes', icon: <FileText size={24} /> },
    { id: ContentType.QUIZ, label: 'Quiz', icon: <BookOpen size={24} /> },
    { id: ContentType.ASSIGNMENT, label: 'Assignment', icon: <FileCheck size={24} /> },
    { id: ContentType.PAPER, label: 'Paper', icon: <FilePlus size={24} /> },
  ];
  
  // Create content mutation
  const { mutate: createContent, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log('Submitting content data:', JSON.stringify(data, null, 2));
      
      // Ensure we have HTML content from editor
      if (!data.htmlContent && editorRef.current) {
        data.htmlContent = editorRef.current.getContent();
      }
      
      // If still no content, provide a default
      if (!data.htmlContent) {
        data.htmlContent = "<p>Empty content</p>";
      }
      
      try {
        const response = await apiRequest('POST', '/api/content', data);
        console.log('Create content response:', response);
        return response;
      } catch (error) {
        console.error('Error creating content:', error);
        throw error;
      }
    },
    onSuccess: async (response) => {
      console.log('Content created successfully:', response);
      toast({
        title: "Content created",
        description: "Your content has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      toast({
        title: "Error creating content",
        description: "Failed to create content. Please check the console for details.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (values: FormValues) => {
    // Get content from the rich text editor
    if (editorRef.current) {
      values.htmlContent = editorRef.current.getContent();
    }
    
    // Log the form submission for debugging
    console.log("Form submitted with values:", values);
    
    // Display a toast to confirm submission attempt
    toast({
      title: "Processing submission",
      description: "Creating your content...",
    });
    
    // Submit the data to the server
    createContent(values);
  };
  
  const handleContentTypeChange = (type: string) => {
    console.log(`Content type selected: ${type}`);
    setActiveContentType(type);
    form.setValue('type', type as any);
    
    // Show toast for debugging purposes
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} selected`,
      description: `You're now creating ${type}.`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold">Create New Content</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Content Type Selection */}
          <div className="mb-6">
            <FormLabel className="block text-sm font-medium text-neutral-700 mb-2">
              Content Type
            </FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {contentTypesInfo.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  className={`flex flex-col items-center p-4 h-auto border-2 ${
                    activeContentType === item.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-neutral-200 hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => handleContentTypeChange(item.id)}
                >
                  <span className={`mb-2 ${activeContentType === item.id ? "text-primary" : "text-neutral-500"}`}>
                    {item.icon}
                  </span>
                  <span className={activeContentType === item.id ? "font-medium text-primary" : "font-medium"}>
                    {item.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a descriptive title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBJECTS.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GRADES.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Difficulty Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-3"
                    >
                      <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                        <RadioGroupItem value={DifficultyLevel.EASY} id="easy" className="mr-2" />
                        <Label htmlFor="easy" className="text-sm font-medium cursor-pointer">Easy</Label>
                      </div>
                      <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                        <RadioGroupItem value={DifficultyLevel.MEDIUM} id="medium" className="mr-2" />
                        <Label htmlFor="medium" className="text-sm font-medium cursor-pointer">Medium</Label>
                      </div>
                      <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                        <RadioGroupItem value={DifficultyLevel.HARD} id="hard" className="mr-2" />
                        <Label htmlFor="hard" className="text-sm font-medium cursor-pointer">Hard</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Content Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <FormLabel className="block text-sm font-medium text-neutral-700">
                Content
              </FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex items-center text-primary"
                onClick={() => setIsAIAssistantOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Assist
              </Button>
            </div>
            <RichTextEditor 
              ref={editorRef}
              placeholder="Start typing your content here..."
              minHeight={280}
            />
            
            {/* AI Assistant Dialog */}
            <AIAssistant 
              isOpen={isAIAssistantOpen}
              onClose={() => setIsAIAssistantOpen(false)}
              onInsertContent={(content) => {
                if (editorRef.current) {
                  editorRef.current.insertText(content);
                  toast({
                    title: "Content inserted",
                    description: "AI-generated content has been added to your document."
                  });
                }
              }}
              subjectContext={form.watch("subject")}
              gradeContext={form.watch("grade")}
            />
          </div>
          
          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => {
                // Convert array to string for display in input field
                const tagsString = Array.isArray(field.value) 
                  ? field.value.join(', ') 
                  : '';
                
                // Handle the onChange to convert comma-separated string back to array
                const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const tagsArray = e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag !== '');
                  field.onChange(tagsArray);
                };
                
                return (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter comma-separated tags" 
                        value={tagsString}
                        onChange={handleTagsChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <p className="text-xs text-neutral-500 mt-1">Tags help students find relevant content</p>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex items-center mt-2"
                    >
                      <div className="flex items-center mr-4">
                        <RadioGroupItem value="false" id="private" className="mr-2" />
                        <Label htmlFor="private" className="text-sm cursor-pointer">Private</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="true" id="public" className="mr-2" />
                        <Label htmlFor="public" className="text-sm cursor-pointer">Public</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <p className="text-xs text-neutral-500 mt-1">Public content can be viewed by all students</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Create Content
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}