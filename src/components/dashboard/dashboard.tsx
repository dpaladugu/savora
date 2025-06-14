
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, Shield, Receipt, CreditCard } from "lucide-react";
import { MetricCard } from "../ui/metric-card";
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";
import { DarkModeToggle } from "../ui/dark-mode-toggle";

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
      icon: Receipt,
      gradient: "bg-gradient-orange"
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
      title: "Goals Progress",
      value: "₹8,20,000",
      change: "12/15",
      changeType: "neutral" as const,
      icon: Target,
      gradient: "bg-gradient-green"
    }
  ];

  const additionalMetrics = [
    {
      title: "Investments",
      value: "₹4,50,000",
      change: "+15.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
      gradient: "bg-gradient-green"
    },
    {
      title: "Credit Cards",
      value: "₹12,500",
      change: "Due in 5 days",
      changeType: "neutral" as const,
      icon: CreditCard,
      gradient: "bg-gradient-blue"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
      <DarkModeToggle />
      
      <div className="pt-12 px-4">
        {/* Header with Savora branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-2"
        >
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Good morning! 👋
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Welcome to Savora - Your financial overview
          </p>
        </motion.div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 px-2">
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

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8 px-2">
          {additionalMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (metrics.length + index) * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Charts Section with proper spacing */}
        <div className="space-y-6 px-2">
          <ExpenseChart />
          <AssetAllocation />
        </div>
      </div>
    </div>
  );
}
