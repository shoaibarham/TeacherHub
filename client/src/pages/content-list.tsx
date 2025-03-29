import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle, ChevronLeft, ChevronRight, FileText, BookOpen, FileCheck, FilePlus, Edit, Eye, Share2, Trash2, Search } from "lucide-react";
import { Content, ContentType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { SUBJECTS, GRADES } from "@/lib/constants";

interface ContentListProps {
  openCreateModal?: () => void;
}

export default function ContentList({ openCreateModal }: ContentListProps) {
  const { type } = useParams<{ type: string }>();
  const [, navigate] = useLocation();
  
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get appropriate title and icon based on content type
  const getTypeDetails = () => {
    switch (type) {
      case ContentType.NOTES:
        return { title: "Notes", icon: <FileText className="mr-2" /> };
      case ContentType.QUIZ:
        return { title: "Quizzes", icon: <BookOpen className="mr-2" /> };
      case ContentType.ASSIGNMENT:
        return { title: "Assignments", icon: <FileCheck className="mr-2" /> };
      case ContentType.PAPER:
        return { title: "Papers", icon: <FilePlus className="mr-2" /> };
      default:
        return { title: "Content", icon: <FileText className="mr-2" /> };
    }
  };
  
  const { title, icon } = getTypeDetails();
  
  // Get content list
  const { data: allContent = [], isLoading } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });
  
  // Filter content by type and other filters
  const filteredContent = allContent.filter(item => {
    // Filter by type
    if (type && item.type !== type) return false;
    
    // Filter by subject
    if (subjectFilter !== "all" && item.subject !== subjectFilter) return false;
    
    // Filter by grade
    if (gradeFilter !== "all" && item.grade !== gradeFilter) return false;
    
    // Filter by search query
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, startIndex + itemsPerPage);
  
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
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          {icon}
          {title}
        </h1>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create {type === ContentType.QUIZ ? "Quiz" : type?.charAt(0).toUpperCase() + type?.slice(1)}
        </Button>
      </div>
      
      <Card className="shadow-sm border border-neutral-100">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
          <CardTitle className="text-lg">All {title}</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[200px] pl-9"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            </div>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow>
                  <TableHead className="w-[250px]">Title</TableHead>
                  {!type && <TableHead>Type</TableHead>}
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
                    <TableCell colSpan={7} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : paginatedContent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No content found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContent.map((item) => (
                    <TableRow key={item.id} className="hover:bg-neutral-50">
                      <TableCell className="py-3">
                        <div className="flex items-center">
                          {getContentTypeIcon(item.type)}
                          <span className="font-medium ml-2">{item.title}</span>
                        </div>
                      </TableCell>
                      {!type && <TableCell className="capitalize">{item.type}</TableCell>}
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
          
          {/* Pagination */}
          {filteredContent.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Showing {Math.min(filteredContent.length, startIndex + 1)} to {Math.min(startIndex + itemsPerPage, filteredContent.length)} of {filteredContent.length} items
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="text-neutral-500 hover:text-primary bg-neutral-50 rounded-lg h-9 w-9"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  const pageNumber = currentPage <= 2 
                    ? i + 1 
                    : currentPage >= totalPages - 1 
                      ? totalPages - 2 + i 
                      : currentPage - 1 + i;
                  
                  if (pageNumber <= totalPages) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className={`rounded-lg px-3 py-1 ${
                          currentPage === pageNumber 
                            ? "text-white" 
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="icon"
                  className="text-neutral-500 hover:text-primary bg-neutral-50 rounded-lg h-9 w-9"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
