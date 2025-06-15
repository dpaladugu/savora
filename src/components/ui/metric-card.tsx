
import { memo } from "react";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  loading?: boolean;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient,
  onClick,
  loading = false
}: MetricCardProps) {
  const changeColor = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  if (loading) {
    return (
      <Card className="metric-card border-border/50 animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "metric-card border-border/50 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${gradient} text-white`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn("text-xs", changeColor[changeType])}>
              {change}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
