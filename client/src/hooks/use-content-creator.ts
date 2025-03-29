import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RichTextEditorRef } from '@/components/ui/rich-text-editor';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { 
  insertContentSchema, 
  ContentType, 
  DifficultyLevel, 
  TopicSuggestion 
} from '@shared/schema';

// Extend the schema for form validation
const formSchema = insertContentSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').map(tag => tag.trim()) : []
  ),
});

export type ContentFormValues = z.infer<typeof formSchema>;

export const useContentCreator = (initialTopic?: TopicSuggestion) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  
  // Initialize form with default values
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTopic?.title || "",
      type: ContentType.NOTES,
      subject: initialTopic?.subject || "",
      grade: initialTopic?.grade || "",
      difficulty: DifficultyLevel.EASY,
      htmlContent: "",
      createdById: 1, // Assuming user ID 1 for now
      isPublic: false,
      tags: ""
    }
  });
  
  // Update form when initialTopic changes
  useState(() => {
    if (initialTopic) {
      form.reset({
        ...form.getValues(),
        title: initialTopic.title,
        subject: initialTopic.subject,
        grade: initialTopic.grade,
      });
    }
  });
  
  // Create content mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      // Get HTML content from editor
      if (editorRef.current) {
        data.htmlContent = editorRef.current.getContent();
      }
      
      return apiRequest('POST', '/api/content', data);
    },
    onSuccess: () => {
      toast({
        title: "Content created",
        description: "Your content has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      form.reset();
      if (editorRef.current) {
        editorRef.current.clear();
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating content",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  // Update content mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ContentFormValues }) => {
      // Get HTML content from editor
      if (editorRef.current) {
        data.htmlContent = editorRef.current.getContent();
      }
      
      return apiRequest('PATCH', `/api/content/${id}`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Content updated",
        description: "Your content has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/content/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating content",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/content/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Content deleted",
        description: "Your content has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting content",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  const handleCreateContent = (values: ContentFormValues) => {
    setIsSubmitting(true);
    createMutation.mutate(values);
  };
  
  const handleUpdateContent = (id: number, values: ContentFormValues) => {
    setIsSubmitting(true);
    updateMutation.mutate({ id, data: values });
  };
  
  const handleDeleteContent = (id: number) => {
    setIsSubmitting(true);
    deleteMutation.mutate(id);
  };
  
  return {
    form,
    editorRef,
    isSubmitting,
    handleCreateContent,
    handleUpdateContent,
    handleDeleteContent
  };
};
