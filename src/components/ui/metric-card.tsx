
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: string;
  onClick?: () => void;
}

export function MetricCard({ 
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
      className={`
        relative overflow-hidden rounded-2xl p-6 cursor-pointer
        metric-card transition-all duration-300 hover:shadow-xl
      `}
      onClick={onClick}
    >
      {/* Subtle gradient overlay for visual appeal without compromising readability */}
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradient} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColors[changeType]} px-2 py-1 rounded-lg bg-background/20 backdrop-blur-sm`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground mb-1 text-readable-muted">
          {title}
        </h3>
        <p className="text-2xl font-bold text-foreground text-readable">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
