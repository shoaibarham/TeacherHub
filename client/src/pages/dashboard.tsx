import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StatsGrid } from "@/components/dashboard/stats";
import { RecentContent } from "@/components/dashboard/recent-content";
import { TopicSuggestions } from "@/components/dashboard/topic-suggestions";
import { TopicSuggestion } from "@shared/schema";

interface DashboardProps {
  openCreateModal?: () => void;
}

export default function Dashboard({ openCreateModal }: DashboardProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | undefined>(undefined);
  
  // Handle creating content from a topic suggestion
  const handleCreateFromTopic = (topic: TopicSuggestion) => {
    setSelectedTopic(topic);
    if (openCreateModal) {
      openCreateModal();
    }
  };
  
  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-heading">Dashboard</h2>
          <Button 
            className="shadow-sm" 
            onClick={openCreateModal}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Content
          </Button>
        </div>

        {/* Quick Stats */}
        <StatsGrid />
      </div>

      {/* Recent Content */}
      <div className="mb-6">
        <RecentContent />
      </div>

      {/* Topic Suggestions */}
      <div className="mb-6">
        <TopicSuggestions onCreateContent={handleCreateFromTopic} />
      </div>
    </>
  );
}
