import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DifficultyLevel, DifficultyLevelValue } from "@shared/schema";

interface DifficultyBadgeProps {
  difficulty: DifficultyLevelValue;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function DifficultyBadge({ 
  difficulty, 
  className, 
  size = "default" 
}: DifficultyBadgeProps) {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case DifficultyLevel.MEDIUM:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case DifficultyLevel.HARD:
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5";
      case "lg":
        return "text-sm px-3 py-1";
      default:
        return "text-xs px-2.5 py-0.5";
    }
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium rounded-full capitalize", 
        getDifficultyColor(),
        getSizeClass(),
        className
      )}
    >
      {difficulty}
    </Badge>
  );
}
