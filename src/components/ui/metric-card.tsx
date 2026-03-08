
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  gradient?: string;
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
  change,
  changeType = 'neutral',
  gradient,
  trend,
  onClick,
  className = "",
  loading = false
}: MetricCardProps) {
  const changeColor =
    changeType === 'positive' ? 'value-positive' :
    changeType === 'negative' ? 'value-negative' :
    'value-neutral';

  const cardContent = (
    <Card
      className={`metric-card ${onClick ? 'cursor-pointer' : ''} ${gradient || ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground leading-tight pr-1">
            {title}
          </p>
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-xl font-bold text-foreground leading-tight mb-1 tabular-nums">
              {value}
            </div>
            {(change || trend) && (
              <div className={`text-xs font-medium ${changeColor}`}>
                {change ?? (trend ? `${trend.isPositive ? '+' : ''}${trend.value}%` : '')}
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
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
