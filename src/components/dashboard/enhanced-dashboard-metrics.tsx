
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, PiggyBank, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/format-utils";

interface EnhancedDashboardMetricsProps {
  dashboardData: DashboardData | null;
  loading: boolean;
}

export function EnhancedDashboardMetrics({ dashboardData, loading }: EnhancedDashboardMetricsProps) {
  if (loading || !dashboardData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const monthlyBudget = dashboardData.monthlyIncome * 0.8; // 80% of income as budget
  const budgetUsed = (dashboardData.monthlyExpenses / monthlyBudget) * 100;
  const savingsRate = dashboardData.savingsRate || 0;
  const emergencyFundProgress = (dashboardData.emergencyFundCurrent / dashboardData.emergencyFundTarget) * 100;

  const metrics = [
    {
      title: "Monthly Expenses",
      value: formatCurrency(dashboardData.monthlyExpenses),
      change: budgetUsed > 100 ? "Over Budget" : `${budgetUsed.toFixed(0)}% of budget`,
      changeType: budgetUsed > 100 ? "negative" : "neutral",
      icon: DollarSign,
      color: "from-red-500 to-pink-600",
      progress: Math.min(budgetUsed, 100),
    },
    {
      title: "Total Investments",
      value: formatCurrency(dashboardData.totalInvestments),
      change: `${dashboardData.investmentCount} investments`,
      changeType: "positive",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      progress: 75, // Mock progress for investments
    },
    {
      title: "Emergency Fund",
      value: formatCurrency(dashboardData.emergencyFundCurrent),
      change: `${emergencyFundProgress.toFixed(0)}% of target`,
      changeType: emergencyFundProgress >= 100 ? "positive" : "neutral",
      icon: PiggyBank,
      color: "from-blue-500 to-cyan-600",
      progress: Math.min(emergencyFundProgress, 100),
    },
    {
      title: "Savings Rate",
      value: `${savingsRate}%`,
      change: savingsRate >= 20 ? "Excellent!" : savingsRate >= 10 ? "Good" : "Needs improvement",
      changeType: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "neutral" : "negative",
      icon: Target,
      color: "from-purple-500 to-indigo-600",
      progress: Math.min(savingsRate * 5, 100), // Scale to 100
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                <metric.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">
                {metric.value}
              </div>
              <div className="flex items-center justify-between mb-3">
                <Badge 
                  variant={
                    metric.changeType === "positive" ? "default" : 
                    metric.changeType === "negative" ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{metric.progress.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={metric.progress} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
