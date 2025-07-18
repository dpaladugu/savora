
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AssetAllocationProps {
  data: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
}

export function AssetAllocation({ data }: AssetAllocationProps) {
  if (!data || data.length === 0) {
    return (
      <div className="metric-card rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
          Asset Allocation
        </h3>
        <p className="text-muted-foreground">No data available for asset allocation.</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.category,
    value: item.percentage,
    color: item.color,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="metric-card rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
        Asset Allocation
      </h3>
      
      <div className="flex items-center">
        <div className="h-48 w-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 ml-6 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-background/30 backdrop-blur-sm border border-border/20">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3 border border-background/20"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground dark:text-slate-200">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {item.value.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
