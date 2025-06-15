
import { motion } from "framer-motion";
import { MetricCard } from "../ui/metric-card";
import { MetricCardProps } from "@/types/dashboard";

interface MetricSectionProps {
  title: string;
  metrics: MetricCardProps[];
  delay?: number;
}

export function MetricSection({ title, metrics, delay = 0 }: MetricSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-3 px-2">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-4 px-2">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
