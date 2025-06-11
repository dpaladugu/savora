
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function AssetAllocation() {
  const data = [
    { name: "Equity", value: 45, color: "#3b82f6" },
    { name: "Debt", value: 25, color: "#10b981" },
    { name: "Gold", value: 15, color: "#f59e0b" },
    { name: "Cash", value: 15, color: "#8b5cf6" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Asset Allocation
      </h3>
      
      <div className="flex items-center">
        <div className="h-48 w-48">
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
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
