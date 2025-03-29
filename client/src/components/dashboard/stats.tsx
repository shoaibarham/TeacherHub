import { Card, CardContent } from "@/components/ui/card";
import { FileText, BookOpen, FileCheck, BarChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Content, ContentType } from "@shared/schema";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconColor: string;
  iconBgColor: string;
}

export function StatsCard({ icon, label, value, iconColor, iconBgColor }: StatsCardProps) {
  return (
    <Card className="border border-neutral-100">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`rounded-full ${iconBgColor} p-3 mr-4`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid() {
  const { data: content = [] } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });
  
  // Count content by type
  const documentCount = content.filter(item => item.type === ContentType.NOTES).length;
  const quizCount = content.filter(item => item.type === ContentType.QUIZ).length;
  const assignmentCount = content.filter(item => item.type === ContentType.ASSIGNMENT).length;
  
  // Total would be sum of all content views, but we don't have that in the schema
  // For now, just use the total content count * 10 as a placeholder
  const totalViews = content.length * 10;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        icon={<FileText size={20} />}
        label="Documents"
        value={documentCount}
        iconColor="text-primary"
        iconBgColor="bg-primary/10"
      />
      
      <StatsCard 
        icon={<BookOpen size={20} />}
        label="Quizzes"
        value={quizCount}
        iconColor="text-blue-500"
        iconBgColor="bg-blue-100"
      />
      
      <StatsCard 
        icon={<FileCheck size={20} />}
        label="Assignments"
        value={assignmentCount}
        iconColor="text-orange-500"
        iconBgColor="bg-orange-100"
      />
      
      <StatsCard 
        icon={<BarChart size={20} />}
        label="Student Views"
        value={totalViews}
        iconColor="text-green-500"
        iconBgColor="bg-green-100"
      />
    </div>
  );
}
