import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CirclePlus, BookmarkPlus, RefreshCw, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { aiService } from "@/lib/aiService";
import { queryClient } from "@/lib/queryClient";
import { TopicSuggestion } from "@shared/schema";
import { SUBJECTS, GRADES } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

interface TopicCardProps {
  topic: TopicSuggestion;
  onCreateContent: (topic: TopicSuggestion) => void;
}

function TopicCard({ topic, onCreateContent }: TopicCardProps) {
  // Ensure difficultyLevels is an array, defaulting to ["medium"] if null
  const difficultyLevels = topic.difficultyLevels || ["medium"];
  
  return (
    <div className="rounded-lg border border-neutral-200 hover:border-primary hover:shadow-md transition-all p-4">
      <div className="flex justify-between mb-2">
        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
          {topic.category || topic.subject}
        </span>
        <div className="flex space-x-1">
          {difficultyLevels.includes("easy") && (
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Easy difficulty"></span>
          )}
          {difficultyLevels.includes("medium") && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" title="Medium difficulty"></span>
          )}
          {difficultyLevels.includes("hard") && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Hard difficulty"></span>
          )}
        </div>
      </div>
      <h4 className="font-medium text-neutral-800 mb-1">{topic.title}</h4>
      <p className="text-sm text-neutral-600 mb-3">{topic.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center text-xs text-neutral-500">
          <Sparkles size={14} className="mr-1" />
          <span>AI generated</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-primary hover:bg-primary/10" 
            title="Create content with this topic"
            onClick={() => onCreateContent(topic)}
          >
            <CirclePlus size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-neutral-500 hover:bg-neutral-100" 
            title="Save for later"
          >
            <BookmarkPlus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TopicSuggestions({ onCreateContent }: { onCreateContent: (topic: TopicSuggestion) => void }) {
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [activeGrade, setActiveGrade] = useState(GRADES[0]);
  
  // Fetch suggestions for current subject and grade
  const { 
    data: suggestions = [] as TopicSuggestion[], 
    isLoading, 
    isError 
  } = useQuery<TopicSuggestion[]>({
    queryKey: ['/api/suggestions', activeSubject, activeGrade],
    queryFn: () => aiService.getSuggestions(activeSubject, activeGrade),
  });
  
  // Mutation to refresh suggestions
  const { mutate: refreshSuggestions, isPending: isRefreshing, error: refreshError } = useMutation({
    mutationFn: () => {
      return aiService.generateSuggestions({
        subject: activeSubject,
        grade: activeGrade,
        count: 6
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions', activeSubject, activeGrade] });
      toast({
        title: "Suggestions refreshed",
        description: "New AI-generated topic suggestions are now available",
      });
    },
    onError: (error) => {
      console.error("Error refreshing suggestions:", error);
      toast({
        title: "Failed to generate suggestions",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    }
  });
  
  const handleSubjectChange = (subject: string) => {
    setActiveSubject(subject);
  };
  
  const handleGradeChange = (grade: string) => {
    setActiveGrade(grade);
  };
  
  return (
    <Card className="shadow-sm border border-neutral-100">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
        <div>
          <CardTitle className="text-lg">AI Topic Suggestions</CardTitle>
          <CardDescription>Powered by Gemini 2.0 Flash</CardDescription>
        </div>
        <Button 
          variant="outline" 
          className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
          onClick={() => refreshSuggestions()}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Suggestions
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Subject Tabs */}
        <Tabs defaultValue={SUBJECTS[0]} value={activeSubject} onValueChange={handleSubjectChange}>
          <TabsList className="w-full overflow-x-auto h-auto bg-transparent border-b pb-0 mb-4 justify-start">
            {SUBJECTS.map(subject => (
              <TabsTrigger 
                key={subject}
                value={subject}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent"
              >
                {subject}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Grade Level Selector */}
          <div className="py-4 flex items-center">
            <div className="text-sm font-medium text-neutral-700 mr-3">Grade Level:</div>
            <div className="flex space-x-2">
              {GRADES.map(grade => (
                <Button
                  key={grade}
                  variant={activeGrade === grade ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full text-sm ${
                    activeGrade === grade 
                      ? "bg-primary text-white" 
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                  onClick={() => handleGradeChange(grade)}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Topic Cards */}
          {isLoading ? (
            <div className="py-8 text-center flex flex-col items-center">
              <RefreshCw size={24} className="animate-spin mb-2 text-primary" />
              <p className="text-neutral-600">Loading topic suggestions...</p>
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <div className="text-red-500 mb-3">
                <p className="font-medium">Failed to load suggestions</p>
                <p className="text-sm text-neutral-600 mt-1">There was a problem fetching suggestions.</p>
              </div>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/suggestions', activeSubject, activeGrade] })}>
                Try Again
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-4">
                <p className="font-medium">No suggestions available</p>
                <p className="text-sm text-neutral-600 mt-1">Let's generate some AI-powered topic suggestions for {activeSubject} ({activeGrade}).</p>
              </div>
              <Button 
                onClick={() => refreshSuggestions()}
                disabled={isRefreshing}
                className="relative"
              >
                {isRefreshing && <RefreshCw size={16} className="absolute left-3 animate-spin" />}
                <span className={isRefreshing ? "pl-4" : ""}>Generate Suggestions</span>
              </Button>
              {refreshError && (
                <p className="mt-3 text-sm text-red-500">
                  Error: {refreshError instanceof Error ? refreshError.message : "Failed to generate. Please try again."}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((topic: TopicSuggestion) => (
                <TopicCard 
                  key={topic.id} 
                  topic={topic} 
                  onCreateContent={onCreateContent} 
                />
              ))}
            </div>
          )}
          
          {suggestions.length > 0 && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                className="text-primary hover:text-primary-dark font-medium flex items-center mx-auto"
              >
                <span>Show more suggestions</span>
                <span className="ml-1">↓</span>
              </Button>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
