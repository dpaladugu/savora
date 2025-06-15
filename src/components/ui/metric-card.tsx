
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { memo } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: string;
  onClick?: () => void;
}

export const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  gradient = "bg-gradient-blue",
  onClick 
}: MetricCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl p-4 cursor-pointer metric-card transition-all duration-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? "button" : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradient} text-white shadow-soft`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-xs font-semibold ${changeColors[changeType]} px-2 py-1 rounded-lg bg-background/80 dark:bg-background/60 backdrop-blur-sm border border-border/30`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          {title}
        </h4>
        <p className="text-xl font-bold text-foreground tracking-tight">
          {value}
        </p>
      </div>
    </motion.div>
  );
});
