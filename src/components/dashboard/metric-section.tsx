
import { motion } from "framer-motion";
import { MetricCard } from "../ui/metric-card";
import { MetricCardProps } from "@/types/dashboard";

interface MetricSectionProps {
  title?: string;
  metrics: MetricCardProps[];
  delay?: number;
}

export function MetricSection({ title, metrics, delay = 0 }: MetricSectionProps) {
  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
          {title}
        </h2>
      )}
      {/* 2-col on all phones, 4-col on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + index * 0.07, duration: 0.3 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
