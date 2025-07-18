
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format-utils";

interface ExpenseChartProps {
  data: {
    category: string;
    amount: number;
  }[];
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="metric-card rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
          Expense Trend
        </h3>
        <p className="text-muted-foreground">No expense data available for this period.</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.category,
    amount: item.amount,
  }));

  const average = data.reduce((acc, item) => acc + item.amount, 0) / data.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="metric-card rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
        Expense Trend
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-muted-foreground text-content">Average monthly</span>
        <span className="font-bold text-foreground">{formatCurrency(average)}</span>
      </div>
    </motion.div>
  );
}
