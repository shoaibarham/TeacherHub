import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Trash2, Eye, Share2, Loader2 } from "lucide-react";
import RichTextEditor, { RichTextEditorRef } from "@/components/ui/rich-text-editor";
import { insertContentSchema, Content, DifficultyLevel, ContentType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { SUBJECTS, GRADES } from "@/lib/constants";

// Create schema for form
const formSchema = insertContentSchema.extend({
  // Add additional validation
  title: z.string().min(3, "Title must be at least 3 characters"),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map(tag => tag.trim()) : []
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Fetch content details
  const { data: content, isLoading, isError } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id,
  });
  
  // Set up form with content data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: ContentType.NOTES,
      subject: "",
      grade: "",
      difficulty: DifficultyLevel.EASY,
      htmlContent: "",
      createdById: 1,
      isPublic: false,
      tags: ""
    }
  });
  
  // Update form when content is loaded
  useEffect(() => {
    if (content) {
      form.reset({
        ...content,
        tags: content.tags ? content.tags.join(', ') : '',
      });
      
      // Update rich text editor content
      if (editorRef.current) {
        editorRef.current.setContent(content.htmlContent);
      }
    }
  }, [content, form]);
  
  // Update content mutation
  const { mutate: updateContent, isPending: isUpdating } = useMutation({
    mutationFn: async (data: FormValues) => {
      // Get HTML content from editor
      if (editorRef.current) {
        data.htmlContent = editorRef.current.getContent();
      }
      
      return apiRequest('PATCH', `/api/content/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Content updated",
        description: "Your content has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/content/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating content",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete content mutation
  const { mutate: deleteContent, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/content/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Content deleted",
        description: "Your content has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Error deleting content",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (values: FormValues) => {
    updateContent(values);
  };
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContent();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError || !content) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">Content not found</h3>
        <p className="text-neutral-500 mb-4">The content you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Content</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter content title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                        disabled // Content type cannot be changed after creation
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ContentType.NOTES}>Notes</SelectItem>
                          <SelectItem value={ContentType.QUIZ}>Quiz</SelectItem>
                          <SelectItem value={ContentType.ASSIGNMENT}>Assignment</SelectItem>
                          <SelectItem value={ContentType.PAPER}>Paper</SelectItem>
                        </SelectContent>
                      </Select>
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
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBJECTS.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
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
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADES.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
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
                          value={field.value}
                          className="flex space-x-3"
                        >
                          <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                            <RadioGroupItem value={DifficultyLevel.EASY} id="edit-easy" className="mr-2" />
                            <Label htmlFor="edit-easy" className="text-sm font-medium cursor-pointer">Easy</Label>
                          </div>
                          <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                            <RadioGroupItem value={DifficultyLevel.MEDIUM} id="edit-medium" className="mr-2" />
                            <Label htmlFor="edit-medium" className="text-sm font-medium cursor-pointer">Medium</Label>
                          </div>
                          <div className="flex items-center p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex-1">
                            <RadioGroupItem value={DifficultyLevel.HARD} id="edit-hard" className="mr-2" />
                            <Label htmlFor="edit-hard" className="text-sm font-medium cursor-pointer">Hard</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter comma-separated tags" {...field} />
                      </FormControl>
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
                          className="flex items-center"
                        >
                          <div className="flex items-center mr-4">
                            <RadioGroupItem value="false" id="edit-private" className="mr-2" />
                            <Label htmlFor="edit-private" className="text-sm cursor-pointer">Private</Label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem value="true" id="edit-public" className="mr-2" />
                            <Label htmlFor="edit-public" className="text-sm cursor-pointer">Public</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div>
                <FormLabel className="block mb-2">Content</FormLabel>
                <RichTextEditor 
                  ref={editorRef}
                  initialContent={content.htmlContent}
                  placeholder="Enter your content here..."
                  minHeight={400}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
