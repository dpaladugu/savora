
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, AlertTriangle, DollarSign, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Goal } from '@/lib/db';

interface FundingRecommendation {
  goalId: string;
  goalName: string;
  amount: number;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

interface AutoGoalSuggestion {
  id: string;
  type: 'Emergency' | 'Retirement' | 'Education' | 'Travel' | 'Home';
  targetAmount: number;
  timeframe: number;
  monthlySip: number;
  reason: string;
}

export function EnhancedAutoGoalDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [fundingRecommendations, setFundingRecommendations] = useState<FundingRecommendation[]>([]);
  const [autoSuggestions, setAutoSuggestions] = useState<AutoGoalSuggestion[]>([]);
  const [totalSurplus, setTotalSurplus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual service calls
      const mockGoals: Goal[] = [];
      const mockSurplus = 15000;
      
      // Generate funding recommendations based on surplus
      const recommendations: FundingRecommendation[] = mockGoals.map(goal => ({
        goalId: goal.id,
        goalName: goal.name,
        amount: Math.min(mockSurplus * 0.3, goal.targetAmount - goal.currentAmount),
        priority: 'High' as const,
        reason: 'Based on current surplus and goal priority'
      }));

      // Generate auto goal suggestions
      const suggestions: AutoGoalSuggestion[] = [
        {
          id: '1',
          type: 'Emergency',
          targetAmount: 300000,
          timeframe: 12,
          monthlySip: 25000,
          reason: 'Recommended 6-month expense buffer'
        },
        {
          id: '2',
          type: 'Retirement',
          targetAmount: 10000000,
          timeframe: 300,
          monthlySip: 15000,
          reason: 'Long-term wealth building for retirement'
        }
      ];

      setGoals(mockGoals);
      setFundingRecommendations(recommendations);
      setAutoSuggestions(suggestions);
      setTotalSurplus(mockSurplus);
    } catch (error) {
      toast.error('Failed to load goal data');
      console.error('Error loading goal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFund = async (goalId: string, amount: number) => {
    try {
      // Mock implementation - replace with actual service call
      toast.success(`Auto-funded ₹${formatCurrency(amount)} towards goal`);
      loadGoalData(); // Refresh data
    } catch (error) {
      toast.error('Failed to auto-fund goal');
      console.error('Error auto-funding goal:', error);
    }
  };

  const handleCreateAutoGoal = async (suggestion: AutoGoalSuggestion) => {
    try {
      // Mock implementation - replace with actual service call
      toast.success(`Created ${suggestion.type} goal with ₹${formatCurrency(suggestion.monthlySip)} monthly SIP`);
      loadGoalData(); // Refresh data
    } catch (error) {
      toast.error('Failed to create auto goal');
      console.error('Error creating auto goal:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading smart goals...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Smart Goal Management</h1>
          <p className="text-muted-foreground">AI-powered goal recommendations and auto-funding</p>
        </div>
      </div>

      {/* Surplus Alert */}
      {totalSurplus > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <DollarSign className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You have ₹{formatCurrency(totalSurplus)} available for goal funding this month!
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-Funding Recommendations */}
      {fundingRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Smart Funding Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fundingRecommendations.map((rec) => (
                <div key={rec.goalId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{rec.goalName}</h4>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}>
                        {rec.priority} Priority
                      </Badge>
                      <span className="text-sm font-medium">₹{formatCurrency(rec.amount)}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleAutoFund(rec.goalId, rec.amount)} className="ml-4">
                    Auto Fund
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Goal Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            AI Goal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {autoSuggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No AI suggestions available. Add some financial data to get personalized recommendations.
            </p>
          ) : (
            <div className="grid gap-4">
              {autoSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{suggestion.type} Goal</h4>
                          <Badge variant="outline">{suggestion.timeframe} months</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{suggestion.reason}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <p className="font-medium">₹{formatCurrency(suggestion.targetAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly SIP:</span>
                            <p className="font-medium">₹{formatCurrency(suggestion.monthlySip)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p className="font-medium">{Math.round(suggestion.timeframe / 12)} years</p>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleCreateAutoGoal(suggestion)} className="ml-4">
                        Create Goal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Goals Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Current Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No goals created yet. Use AI suggestions above to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{goal.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        ₹{formatCurrency(goal.currentAmount)} / ₹{formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress value={progress} className="mb-2" />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
                      <span className="text-muted-foreground">
                        Target: {goal.targetDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
