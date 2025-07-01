
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Target, CreditCard, Shield, X } from "lucide-react";
import { FirestoreService } from "@/services/firestore"; // Note: This service might need to be ExpenseManager if that's the consolidated source
import { useAuth } from "@/contexts/auth-context";
// import { GlobalHeader } from "@/components/layout/global-header"; // Removed

interface Recommendation {
  id: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  title: string;
  message: string;
  action?: string;
  actionCallback?: () => void;
  icon: any;
  dismissible: boolean;
}

export function RecommendationsEngine() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateRecommendations();
      loadDismissedRecommendations();
    }
  }, [user]);

  const loadDismissedRecommendations = () => {
    const dismissed = localStorage.getItem('dismissed-recommendations');
    if (dismissed) {
      setDismissedIds(JSON.parse(dismissed));
    }
  };

  const generateRecommendations = async () => {
    if (!user) return;
    
    try {
      const [expenses, investments] = await Promise.all([
        FirestoreService.getExpenses(user.uid),
        FirestoreService.getInvestments(user.uid)
      ]);

      const recs: Recommendation[] = [];
      
      // Emergency Fund Analysis
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyExpenses = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const emergencyFundCurrent = totalInvestments * 0.1; // Assume 10% is emergency fund
      const emergencyFundRequired = monthlyExpenses * 6;
      
      if (emergencyFundCurrent < emergencyFundRequired) {
        const shortfall = emergencyFundRequired - emergencyFundCurrent;
        recs.push({
          id: 'emergency-fund-low',
          type: 'warning',
          title: 'Emergency Fund Below Target',
          message: `Your emergency fund is ₹${shortfall.toLocaleString()} short. Consider saving ₹${Math.round(shortfall / 12).toLocaleString()}/month.`,
          action: 'View Emergency Fund',
          icon: Shield,
          dismissible: true
        });
      }

      // Credit Card Utilization Warning - Fixed property name
      const creditCardExpenses = expenses.filter(exp => exp.paymentMethod === 'Credit Card');
      const thisMonthCCExpenses = creditCardExpenses
        .filter(exp => exp.date.startsWith(currentMonth))
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      if (thisMonthCCExpenses > 50000) {
        recs.push({
          id: 'high-cc-usage',
          type: 'urgent',
          title: 'High Credit Card Usage',
          message: `You've spent ₹${thisMonthCCExpenses.toLocaleString()} on credit cards this month. Monitor your limits.`,
          action: 'View Credit Cards',
          icon: CreditCard,
          dismissible: true
        });
      }

      // Investment Goals Check
      if (investments.length === 0) {
        recs.push({
          id: 'no-investments',
          type: 'info',
          title: 'Start Your Investment Journey',
          message: 'You haven\'t recorded any investments yet. Consider starting with mutual funds or emergency fund building.',
          action: 'Add Investment',
          icon: TrendingUp,
          dismissible: true
        });
      }

      // Expense Category Analysis
      const categories = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
      if (topCategory && topCategory[1] > monthlyExpenses * 0.3) {
        recs.push({
          id: 'high-category-spend',
          type: 'info',
          title: 'High Category Spending',
          message: `${topCategory[0]} accounts for ${Math.round((topCategory[1] / (monthlyExpenses || 1)) * 100)}% of your monthly expenses.`,
          action: 'View Expenses',
          icon: AlertTriangle,
          dismissible: true
        });
      }

      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissRecommendation = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed-recommendations', JSON.stringify(newDismissed));
  };

  const filteredRecommendations = recommendations.filter(rec => !dismissedIds.includes(rec.id));

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'warning': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-950';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-orange-600 dark:text-orange-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // These are expected to be handled by the parent router using ModuleHeader.
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your financial data...</p>
          </div>
        ) : (
          <>
            {filteredRecommendations.length === 0 ? (
              <Card className="metric-card border-border/50">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">All Good!</h3>
                  <p className="text-muted-foreground">
                    Your finances look healthy. Keep up the good work!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRecommendations.map((rec) => (
                  <Card key={rec.id} className={`border-l-4 ${getTypeColor(rec.type)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <rec.icon className={`w-5 h-5 mt-1 ${getIconColor(rec.type)}`} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{rec.message}</p>
                            {rec.action && (
                              <Button size="sm" variant="outline">
                                {rec.action}
                              </Button>
                            )}
                          </div>
                        </div>
                        {rec.dismissible && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissRecommendation(rec.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="metric-card border-border/50">
              <CardHeader>
                <CardTitle>Financial Health Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Maintain 6 months of expenses as emergency fund</p>
                  <p>• Keep credit card utilization below 30%</p>
                  <p>• Review and rebalance investments quarterly</p>
                  <p>• Track expenses daily for better insights</p>
                  <p>• Link all expenses to financial goals</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      {/* Removed extra closing </div> tag that was here */}
    </div>
  );
}
