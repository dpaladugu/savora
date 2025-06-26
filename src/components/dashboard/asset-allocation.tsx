
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function AssetAllocation() {
  const data = [
    { name: "Equity", value: 45, color: "hsl(var(--primary))" },
    { name: "Debt", value: 25, color: "hsl(var(--success))" },
    { name: "Gold", value: 15, color: "hsl(var(--warning))" },
    { name: "Cash", value: 15, color: "hsl(var(--secondary))" },
  ];

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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 ml-6 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-background/30 backdrop-blur-sm border border-border/20">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3 border border-background/20"
                  style={{ backgroundColor: item.color }}
                />
                {/* Removed text-content, explicitly setting dark mode color for better contrast */}
                <span className="text-sm text-muted-foreground dark:text-slate-200">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
