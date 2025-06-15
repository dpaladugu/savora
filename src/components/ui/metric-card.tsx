
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  onClick,
  className = "",
  loading = false
}: MetricCardProps) {
  const cardContent = (
    <Card 
      className={`metric-card cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </h3>
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground mb-1">
              {value}
            </div>
            {trend && (
              <div className={`text-xs flex items-center ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                <span>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
