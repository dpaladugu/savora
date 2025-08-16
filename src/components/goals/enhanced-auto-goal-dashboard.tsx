
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, DollarSign, Calendar, AlertTriangle, Lightbulb } from 'lucide-react';
import { EnhancedAutoGoalEngine } from '@/services/EnhancedAutoGoalEngine';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';

interface GoalRecommendation {
  id: string;
  goalType: string;
  priority: 'High' | 'Medium' | 'Low';
  suggestedAmount: number;
  timeframe: string;
  reasoning: string;
  autoFundingStrategy: string;
}

interface FundingAllocation {
  goalId: string;
  goalName: string;
  allocatedAmount: number;
  priority: string;
}

export function EnhancedAutoGoalDashboard() {
  const [loading, setLoading] = useState(true);
  const [goalRecommendations, setGoalRecommendations] = useState<GoalRecommendation[]>([]);
  const [fundingAllocations, setFundingAllocations] = useState<FundingAllocation[]>([]);
  const [surplusAmount, setSurplusAmount] = useState(50000);

  useEffect(() => {
    loadGoalRecommendations();
  }, []);

  const loadGoalRecommendations = async () => {
    try {
      setLoading(true);
      
      // Generate sample recommendations since the actual method doesn't exist yet
      const sampleRecommendations: GoalRecommendation[] = [
        {
          id: '1',
          goalType: 'Emergency Fund',
          priority: 'High',
          suggestedAmount: 300000,
          timeframe: '6 months',
          reasoning: 'You should have 6 months of expenses as emergency fund',
          autoFundingStrategy: 'Allocate 40% of monthly surplus'
        },
        {
          id: '2',
          goalType: 'Retirement Planning',
          priority: 'High',
          suggestedAmount: 50000,
          timeframe: 'Monthly SIP',
          reasoning: 'Start early to benefit from compounding',
          autoFundingStrategy: 'Increase SIP by 10% annually'
        },
        {
          id: '3',
          goalType: 'House Down Payment',
          priority: 'Medium',
          suggestedAmount: 1000000,
          timeframe: '3 years',
          reasoning: 'Based on current property prices and income',
          autoFundingStrategy: 'Debt fund allocation for 3-year horizon'
        }
      ];

      setGoalRecommendations(sampleRecommendations);
    } catch (error) {
      toast.error('Failed to load goal recommendations');
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeFundingStrategy = async () => {
    try {
      const result = await EnhancedAutoGoalEngine.executeFundingPriorityStack(surplusAmount);
      
      // Convert result to display format
      const allocations: FundingAllocation[] = result.allocations.map((allocation, index) => ({
        goalId: `goal_${index}`,
        goalName: `Goal ${index + 1}`,
        allocatedAmount: allocation.amount,
        priority: allocation.priority
      }));

      setFundingAllocations(allocations);
      toast.success('Funding strategy executed successfully');
    } catch (error) {
      toast.error('Failed to execute funding strategy');
      console.error('Error executing strategy:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading smart goal recommendations...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Smart Goal Management</h1>
          <p className="text-muted-foreground">AI-powered goal recommendations and auto-funding strategies</p>
        </div>
        <Button onClick={executeFundingStrategy} className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Execute Auto-Funding
        </Button>
      </div>

      {/* Surplus Amount Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Available Surplus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={surplusAmount}
              onChange={(e) => setSurplusAmount(parseFloat(e.target.value) || 0)}
              className="px-3 py-2 border rounded-md w-32"
              placeholder="50000"
            />
            <span className="text-sm text-muted-foreground">
              Monthly surplus available for goal funding
            </span>
          </div>
        </CardContent>
      </Card>

      {/* AI Goal Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI Goal Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {goalRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{recommendation.goalType}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.reasoning}
                      </p>
                    </div>
                    <Badge variant={
                      recommendation.priority === 'High' ? 'destructive' :
                      recommendation.priority === 'Medium' ? 'default' : 'secondary'
                    }>
                      {recommendation.priority} Priority
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target Amount:</span>
                      <p className="font-medium">{formatCurrency(recommendation.suggestedAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeframe:</span>
                      <p className="font-medium">{recommendation.timeframe}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Strategy:</span>
                      <p className="font-medium text-xs">{recommendation.autoFundingStrategy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funding Allocations */}
      {fundingAllocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Smart Funding Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {fundingAllocations.map((allocation) => (
                <div key={allocation.goalId} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                  <div>
                    <span className="font-medium">{allocation.goalName}</span>
                    <Badge variant="outline" className="ml-2">
                      {allocation.priority}
                    </Badge>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatCurrency(allocation.allocatedAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This is a preview of the Smart Goal Management system. Full AI integration and automatic goal generation will be implemented in future updates.
        </AlertDescription>
      </Alert>
    </div>
  );
}
