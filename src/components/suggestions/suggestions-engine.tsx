
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, CreditCard, Target, Calendar, DollarSign } from "lucide-react";

interface Suggestion {
  id: string;
  type: 'warning' | 'opportunity' | 'reminder' | 'goal';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'expenses' | 'savings' | 'investments' | 'payments' | 'goals';
}

export function SuggestionsEngine() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    // Generate suggestions based on user data
    generateSuggestions();
  }, []);

  const generateSuggestions = () => {
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Food Expenses',
        description: 'Your food expenses are 25% higher than last month. Consider meal planning.',
        action: 'Review food expenses',
        priority: 'medium',
        category: 'expenses'
      },
      {
        id: '2',
        type: 'reminder',
        title: 'Credit Card Due Soon',
        description: 'HDFC Regalia bill of ₹12,500 is due in 3 days',
        action: 'Pay credit card bill',
        priority: 'high',
        category: 'payments'
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Emergency Fund Target',
        description: 'You\'re only 15% away from your 6-month emergency fund goal',
        action: 'Add ₹45,000 more',
        priority: 'medium',
        category: 'goals'
      },
      {
        id: '4',
        type: 'reminder',
        title: 'SIP Due Tomorrow',
        description: 'Monthly SIP of ₹15,000 will be deducted tomorrow',
        priority: 'low',
        category: 'investments'
      },
      {
        id: '5',
        type: 'warning',
        title: 'Low Savings Rate',
        description: 'Your savings rate is only 12% this month. Target is 20%.',
        action: 'Reduce discretionary spending',
        priority: 'high',
        category: 'savings'
      }
    ];

    setSuggestions(mockSuggestions);
  };

  const getIcon = (type: string, category: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'opportunity':
        return TrendingUp;
      case 'reminder':
        return category === 'payments' ? CreditCard : Calendar;
      case 'goal':
        return Target;
      default:
        return DollarSign;
    }
  };

  const getColorClass = (type: string, priority: string) => {
    if (type === 'warning' && priority === 'high') return 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800';
    if (type === 'warning') return 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800';
    if (type === 'opportunity') return 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800';
    if (type === 'reminder' && priority === 'high') return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800';
    return 'border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-800';
  };

  const getIconColor = (type: string, priority: string) => {
    if (type === 'warning' && priority === 'high') return 'text-red-600';
    if (type === 'warning') return 'text-orange-600';
    if (type === 'opportunity') return 'text-green-600';
    if (type === 'reminder' && priority === 'high') return 'text-blue-600';
    return 'text-gray-600';
  };

  const prioritySuggestions = suggestions.filter(s => s.priority === 'high');
  const otherSuggestions = suggestions.filter(s => s.priority !== 'high');

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          Suggestions
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Smart insights based on your financial data
        </p>
      </div>

      {prioritySuggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Priority Actions
          </h2>
          {prioritySuggestions.map((suggestion) => {
            const Icon = getIcon(suggestion.type, suggestion.category);
            return (
              <Card key={suggestion.id} className={`${getColorClass(suggestion.type, suggestion.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(suggestion.type, suggestion.priority)}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      {suggestion.action && (
                        <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded border">
                          {suggestion.action}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {otherSuggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Other Insights</h2>
          {otherSuggestions.map((suggestion) => {
            const Icon = getIcon(suggestion.type, suggestion.category);
            return (
              <Card key={suggestion.id} className={`${getColorClass(suggestion.type, suggestion.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(suggestion.type, suggestion.priority)}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      {suggestion.action && (
                        <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded border">
                          {suggestion.action}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">How Suggestions Work</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Expense Analysis:</strong> Identifies unusual spending patterns and high-expense categories</li>
            <li>• <strong>Payment Reminders:</strong> Alerts for upcoming EMIs, credit card bills, and due dates</li>
            <li>• <strong>Goal Tracking:</strong> Shows progress towards your financial goals and targets</li>
            <li>• <strong>Savings Optimization:</strong> Suggests ways to improve your savings rate</li>
            <li>• <strong>Investment Opportunities:</strong> Recommends rebalancing and new investment options</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
