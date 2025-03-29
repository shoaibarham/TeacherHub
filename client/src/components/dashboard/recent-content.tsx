import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { FileText, BookOpen, FileCheck, FilePlus, Edit, Eye, Share2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Content, ContentType } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

export function RecentContent() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [, navigate] = useLocation();
  
  const { data: contentList = [], isLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });
  
  // Apply filters to content list
  const filteredContent = contentList.filter(item => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (subjectFilter !== "all" && item.subject !== subjectFilter) return false;
    return true;
  });
  
  // Extract unique subjects for filter
  const uniqueSubjects = Array.from(new Set(contentList.map(item => item.subject)));
  
  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case ContentType.NOTES:
        return <FileText size={18} className="text-blue-500" />;
      case ContentType.QUIZ:
        return <BookOpen size={18} className="text-orange-500" />;
      case ContentType.ASSIGNMENT:
        return <FileCheck size={18} className="text-primary" />;
      case ContentType.PAPER:
        return <FilePlus size={18} className="text-blue-500" />;
      default:
        return <FileText size={18} className="text-gray-500" />;
    }
  };
  
  // Format relative time
  const formatRelativeTime = (date: string | undefined) => {
    if (!date) return "Unknown";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Handle content deletion
  const handleDeleteContent = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      try {
        await apiRequest('DELETE', `/api/content/${id}`);
        queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        toast({
          title: "Content deleted",
          description: "The content has been successfully deleted",
        });
      } catch (error) {
        toast({
          title: "Failed to delete content",
          description: "An error occurred while deleting the content",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <Card className="shadow-sm border border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
        <CardTitle className="text-lg">Recent Content</CardTitle>
        <div className="flex space-x-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-neutral-50 border border-neutral-200 rounded-lg h-9 w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={ContentType.NOTES}>Notes</SelectItem>
              <SelectItem value={ContentType.QUIZ}>Quizzes</SelectItem>
              <SelectItem value={ContentType.ASSIGNMENT}>Assignments</SelectItem>
              <SelectItem value={ContentType.PAPER}>Papers</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="bg-neutral-50 border border-neutral-200 rounded-lg h-9 w-[150px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {uniqueSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">Loading content...</TableCell>
              </TableRow>
            ) : filteredContent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No content found</TableCell>
              </TableRow>
            ) : (
              filteredContent.slice(0, 5).map((item) => (
                <TableRow key={item.id} className="hover:bg-neutral-50">
                  <TableCell className="py-3">
                    <div className="flex items-center">
                      {getContentTypeIcon(item.type)}
                      <span className="font-medium ml-2">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{item.grade}</TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={item.difficulty as any} />
                  </TableCell>
                  <TableCell className="text-neutral-500">{formatRelativeTime("2023-06-15")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-primary"
                        title="Edit"
                        onClick={() => navigate(`/content/detail/${item.id}`)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-primary"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-primary"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-500"
                        title="Delete"
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Showing {Math.min(filteredContent.length, 5)} of {filteredContent.length} items
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="text-neutral-500 hover:text-primary bg-neutral-50 rounded-lg h-9 w-9"
            disabled={true}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-lg px-3 py-1 text-white"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-neutral-600 hover:bg-neutral-100 rounded-lg px-3 py-1"
          >
            2
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-neutral-500 hover:text-primary bg-neutral-50 rounded-lg h-9 w-9"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
