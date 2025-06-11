
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Shield } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";

export function Dashboard() {
  // Mock data - will be replaced with real data later
  const metrics = [
    {
      title: "Net Worth",
      value: "₹12,45,000",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: DollarSign,
      gradient: "bg-gradient-blue"
    },
    {
      title: "This Month",
      value: "₹45,600",
      change: "-12%",
      changeType: "negative" as const,
      icon: TrendingUp,
      gradient: "bg-gradient-green"
    },
    {
      title: "Emergency Fund",
      value: "₹2,50,000",
      change: "85%",
      changeType: "positive" as const,
      icon: Shield,
      gradient: "bg-gradient-purple"
    },
    {
      title: "Goals",
      value: "₹8,20,000",
      change: "12/15",
      changeType: "neutral" as const,
      icon: Target,
      gradient: "bg-gradient-orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <div className="pt-12 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 text-readable">
            Good morning! 👋
          </h1>
          <p className="text-muted-foreground text-readable-muted">
            Here's your financial overview
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <ExpenseChart />
          <AssetAllocation />
        </div>
      </div>
    </div>
  );
}
