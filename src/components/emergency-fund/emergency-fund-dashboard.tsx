
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmergencyFundService } from '@/services/EmergencyFundService';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { Shield, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import type { EmergencyFund } from '@/lib/db';

export function EmergencyFundDashboard() {
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmergencyFundData();
  }, []);

  const loadEmergencyFundData = async () => {
    try {
      setLoading(true);
      
      // Get or create emergency fund
      let fund = await EmergencyFundService.getEmergencyFund();
      if (!fund) {
        fund = await EmergencyFundService.createEmergencyFund({
          targetMonths: 12,
          targetAmount: 600000, // Default target
          currentAmount: 0
        });
      }
      
      setEmergencyFund(fund);
      
      // Calculate monthly expenses (placeholder - would use actual expense data)
      setMonthlyExpenses(50000);
    } catch (error) {
      console.error('Error loading emergency fund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAmount = async (amount: number) => {
    if (!emergencyFund) return;
    
    try {
      await EmergencyFundService.updateCurrentAmount(emergencyFund.id, amount);
      await loadEmergencyFundData();
    } catch (error) {
      console.error('Error updating emergency fund:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!emergencyFund) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to load emergency fund data
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = emergencyFund.targetAmount > 0 
    ? (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100 
    : 0;

  const getStatus = () => {
    if (progressPercentage >= 100) return { status: 'Achieved', color: 'success', icon: CheckCircle };
    if (progressPercentage >= 75) return { status: 'On Track', color: 'primary', icon: TrendingUp };
    if (progressPercentage >= 50) return { status: 'Progress', color: 'warning', icon: AlertCircle };
    return { status: 'Behind', color: 'destructive', icon: AlertCircle };
  };

  const statusInfo = getStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Emergency Fund
          </CardTitle>
          <Badge variant={statusInfo.color as any} className="ml-auto">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Current Amount</p>
                <p className="text-2xl font-bold">₹{emergencyFund.currentAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target Amount</p>
                <p className="text-2xl font-bold">₹{emergencyFund.targetAmount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Target Months</p>
                <p className="font-semibold">{emergencyFund.targetMonths} months</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="font-semibold">₹{monthlyExpenses.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateAmount(emergencyFund.currentAmount + 10000)}
              >
                +₹10K
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateAmount(emergencyFund.currentAmount + 25000)}
              >
                +₹25K
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateAmount(emergencyFund.currentAmount + 50000)}
              >
                +₹50K
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Fund Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progressPercentage < 100 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Top up your emergency fund</p>
                  <p className="text-xs text-muted-foreground">
                    You need ₹{(emergencyFund.targetAmount - emergencyFund.currentAmount).toLocaleString()} more to reach your target
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Keep funds in liquid instruments</p>
                <p className="text-xs text-muted-foreground">
                  Emergency funds should be in savings accounts or liquid funds for quick access
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
