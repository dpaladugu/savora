
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export function ExpenseChart() {
  const data = [
    { month: "Jan", amount: 45000 },
    { month: "Feb", amount: 52000 },
    { month: "Mar", amount: 48000 },
    { month: "Apr", amount: 55000 },
    { month: "May", amount: 49000 },
    { month: "Jun", amount: 46000 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Expense Trend
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis hide />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Average monthly</span>
        <span className="font-semibold text-foreground">₹49,167</span>
      </div>
    </motion.div>
  );
}
