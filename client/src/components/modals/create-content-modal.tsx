import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { 
  FileText, BookOpen, FileCheck, FilePlus, RefreshCw, Sparkles 
} from "lucide-react";
import { 
  insertContentSchema, 
  ContentType, 
  DifficultyLevel,
  TopicSuggestion
} from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { SUBJECTS, GRADES } from "@/lib/constants";
import { aiService } from "@/lib/aiService";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: TopicSuggestion;
}

const formSchema = insertContentSchema.extend({
  // Add additional validation as needed
  title: z.string().min(3, "Title must be at least 3 characters"),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map(tag => tag.trim()) : []
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateContentModal({ 
  isOpen, 
  onClose,
  initialTopic 
}: CreateContentModalProps) {
  const [activeContentType, setActiveContentType] = useState<string>(ContentType.NOTES);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTopic?.title || "",
      type: ContentType.NOTES,
      subject: initialTopic?.subject || "",
      grade: initialTopic?.grade || "",
      difficulty: DifficultyLevel.EASY,
      htmlContent: "",
      createdById: 1, // Hardcoded for now
      isPublic: false,
      tags: []
    }
  });
  
  // Update form when initialTopic changes
  React.useEffect(() => {
    if (initialTopic) {
      form.reset({
        ...form.getValues(),
        title: initialTopic.title,
        subject: initialTopic.subject,
        grade: initialTopic.grade,
      });
    }
  }, [initialTopic, form]);
  
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
      onClose();
      form.reset();
      if (editorRef.current) {
        editorRef.current.clear();
      }
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      toast({
        title: "Error creating content",
        description: "Failed to create content. Please try again.",
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
  
  const fetchAiSuggestions = async () => {
    const subject = form.getValues('subject');
    const grade = form.getValues('grade');
    
    if (!subject || !grade) {
      toast({
        title: "Missing information",
        description: "Please select a subject and grade level first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingSuggestions(true);
    
    try {
      const result = await aiService.generateSuggestions({
        subject,
        grade,
        count: 3
      });
      
      setAiSuggestions(result.suggestions);
    } catch (error) {
      toast({
        title: "Failed to get AI suggestions",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  const applySuggestion = (suggestion: TopicSuggestion) => {
    form.setValue('title', suggestion.title);
    // You could also update other fields or insert content into the editor
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Content</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <Form {...form}>
            <form id="create-content-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <div className="mb-6">
                <FormLabel className="block text-sm font-medium text-neutral-700 mb-1">
                  Content
                </FormLabel>
                <RichTextEditor 
                  ref={editorRef}
                  placeholder="Start typing your content here..."
                  minHeight={280}
                />
              </div>
              
              {/* AI Suggestions */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Sparkles className="text-primary mr-2" size={18} />
                    <h4 className="font-medium">AI Topic Suggestions</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                    onClick={fetchAiSuggestions}
                    disabled={isLoadingSuggestions}
                  >
                    {isLoadingSuggestions && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Refresh suggestions
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-white rounded border border-neutral-200 hover:border-primary cursor-pointer transition-colors"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <h5 className="font-medium text-sm">{suggestion.title}</h5>
                        <p className="text-xs text-neutral-600 mt-1">{suggestion.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 col-span-3 text-center text-neutral-500 text-sm">
                      {isLoadingSuggestions 
                        ? "Loading suggestions..." 
                        : "Select a subject and grade, then click 'Refresh suggestions' to get AI-powered topic ideas"}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter comma-separated tags" {...field} />
                      </FormControl>
                      <p className="text-xs text-neutral-500 mt-1">Tags help students find relevant content</p>
                      <FormMessage />
                    </FormItem>
                  )}
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
                      <p className="text-xs text-neutral-500 mt-1">Public content can be viewed by all students in your school</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="border-t border-neutral-200 pt-4 mt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isPending}
            onClick={() => {
              // Direct submission method instead of relying on form submit
              console.log("Save button clicked");
              
              // Get all form values
              const values = form.getValues();
              
              // Check for required fields
              if (!values.title) {
                toast({
                  title: "Title required",
                  description: "Please enter a title for your content",
                  variant: "destructive"
                });
                return;
              }
              
              if (!values.subject) {
                toast({
                  title: "Subject required",
                  description: "Please select a subject for your content",
                  variant: "destructive"
                });
                return;
              }
              
              if (!values.grade) {
                toast({
                  title: "Grade required",
                  description: "Please select a grade level for your content",
                  variant: "destructive"
                });
                return;
              }
              
              // Get content from editor
              if (editorRef.current) {
                values.htmlContent = editorRef.current.getContent();
              }
              
              // If still no content, add default content
              if (!values.htmlContent) {
                values.htmlContent = "<p>Enter your content here</p>";
              }
              
              console.log("Submitting form with values:", values);
              
              // Display toast
              toast({
                title: "Creating content",
                description: "Saving your content..."
              });
              
              // Submit directly to the mutation
              createContent(values);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            {isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Create & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
