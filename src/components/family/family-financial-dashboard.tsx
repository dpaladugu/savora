
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Wallet, TrendingUp, Shield, Heart } from 'lucide-react';
import { GoldService } from '@/services/GoldService';
import { LoanService } from '@/services/LoanService';
import { HealthService } from '@/services/HealthService';
import { formatCurrency } from '@/lib/format-utils';

interface FamilyMember {
  name: string;
  goldHoldings: number;
  healthScore: number;
  loanBurden: number;
}

export function FamilyFinancialDashboard() {
  const [familyData, setFamilyData] = useState<{
    totalGoldValue: number;
    totalLoans: number;
    healthMetrics: any;
    members: FamilyMember[];
  }>({
    totalGoldValue: 0,
    totalLoans: 0,
    healthMetrics: null,
    members: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      // Get gold investments by family member
      const goldInvestments = await GoldService.getAllGold();
      const goldByMember = goldInvestments.reduce((acc, gold) => {
        acc[gold.familyMember] = (acc[gold.familyMember] || 0) + gold.purchasePrice;
        return acc;
      }, {} as Record<string, number>);

      // Get loan analytics
      const loanAnalytics = await LoanService.getLoanAnalytics();
      
      // Get health metrics
      const healthMetrics = await HealthService.getHealthAnalytics();

      // Calculate current gold value (assuming ₹5500 per gram)
      const currentGoldRate = 5500;
      const goldValue = await GoldService.calculateCurrentGoldValue(currentGoldRate);

      // Create family members data
      const memberNames = [...new Set(goldInvestments.map(g => g.familyMember))];
      const members: FamilyMember[] = memberNames.map(name => ({
        name,
        goldHoldings: goldByMember[name] || 0,
        healthScore: Math.floor(Math.random() * 30 + 70), // Mock health score
        loanBurden: name === 'Self' ? loanAnalytics.totalOutstanding : 0
      }));

      setFamilyData({
        totalGoldValue: goldValue.currentMarketValue,
        totalLoans: loanAnalytics.totalOutstanding,
        healthMetrics,
        members
      });
    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading family dashboard...</div>;
  }

  const totalFamilyWealth = familyData.totalGoldValue - familyData.totalLoans;
  const wealthGrowth = 8.5; // Mock growth percentage

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Family Financial Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive overview of family finances and health</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Family Wealth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFamilyWealth)}</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-3 h-3" />
              +{wealthGrowth}% this year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Gold Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(familyData.totalGoldValue)}</div>
            <p className="text-sm text-muted-foreground">Across all family members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(familyData.totalLoans)}</div>
            <p className="text-sm text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Family Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-sm text-muted-foreground">Overall health score</p>
          </CardContent>
        </Card>
      </div>

      {/* Family Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {familyData.members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No family member data available. Add gold investments to see family breakdown.
              </p>
            ) : (
              familyData.members.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      <Badge variant="outline">
                        {member.name === 'Self' ? 'Primary' : 'Family'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Gold Holdings:</span>
                        <p className="font-medium">{formatCurrency(member.goldHoldings)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Health Score:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={member.healthScore} className="flex-1" />
                          <span className="font-medium">{member.healthScore}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loan Burden:</span>
                        <p className="font-medium text-red-600">{formatCurrency(member.loanBurden)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wealth Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Gold Investments</span>
                <span className="font-medium">{formatCurrency(familyData.totalGoldValue)}</span>
              </div>
              <Progress value={75} />
              
              <div className="flex justify-between items-center">
                <span>Cash & Bank</span>
                <span className="font-medium">{formatCurrency(200000)}</span>
              </div>
              <Progress value={15} />
              
              <div className="flex justify-between items-center">
                <span>Other Assets</span>
                <span className="font-medium">{formatCurrency(100000)}</span>
              </div>
              <Progress value={10} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">A+</div>
              <p className="text-muted-foreground mb-4">Excellent financial health</p>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span>Emergency Fund</span>
                  <Badge variant="outline" className="text-green-600">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Debt-to-Income Ratio</span>
                  <Badge variant="outline" className="text-yellow-600">Moderate</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Investment Diversity</span>
                  <Badge variant="outline" className="text-green-600">Good</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Insurance Coverage</span>
                  <Badge variant="outline" className="text-red-600">Needs Attention</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
