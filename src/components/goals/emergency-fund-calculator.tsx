
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Calculator, TrendingUp, Users } from "lucide-react";
import { GlobalHeader } from "@/components/layout/global-header";
import { FirestoreService } from "@/services/firestore";
import { useAuth } from "@/contexts/auth-context";

export function EmergencyFundCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dependents, setDependents] = useState(0);
  const [monthlyEMIs, setMonthlyEMIs] = useState(0);
  const [insurancePremiums, setInsurancePremiums] = useState(0);
  const [bufferPercentage, setBufferPercentage] = useState(20);
  const [currentCorpus, setCurrentCorpus] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      calculateFromExpenses();
    }
  }, [user]);

  const calculateFromExpenses = async () => {
    if (!user) return;
    
    try {
      const expenses = await FirestoreService.getExpenses(user.uid);
      
      // Calculate average monthly expenses from last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentExpenses = expenses.filter(expense => 
        new Date(expense.date) >= threeMonthsAgo
      );
      
      const totalRecent = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const avgMonthly = totalRecent / 3;
      
      setMonthlyExpenses(Math.round(avgMonthly));
      
      console.log(`Calculated average monthly expenses: ₹${avgMonthly.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to calculate expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEmergencyFund = () => {
    const baseExpenses = monthlyExpenses;
    const dependentFactor = dependents * 0.3; // 30% extra per dependent
    const emiBuffer = monthlyEMIs;
    const insuranceBuffer = insurancePremiums / 12; // Monthly equivalent
    const bufferAmount = (baseExpenses * bufferPercentage) / 100;
    
    const monthlyRequired = baseExpenses + (baseExpenses * dependentFactor) + emiBuffer + insuranceBuffer + bufferAmount;
    const emergencyFundRequired = monthlyRequired * 6; // 6 months coverage
    
    return {
      monthlyRequired: Math.round(monthlyRequired),
      emergencyFundRequired: Math.round(emergencyFundRequired),
      currentCoverage: currentCorpus > 0 ? Math.round(currentCorpus / monthlyRequired) : 0,
      shortfall: Math.max(0, emergencyFundRequired - currentCorpus)
    };
  };

  const calculation = calculateEmergencyFund();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="Emergency Fund Calculator" />
      
      <div className="pt-20 px-4 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Calculating from your expense data...</p>
          </div>
        ) : (
          <>
            <Card className="metric-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Emergency Fund Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Monthly Expenses (Auto-calculated)
                    </label>
                    <Input
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                      placeholder="Monthly expenses"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Number of Dependents
                    </label>
                    <Input
                      type="number"
                      value={dependents}
                      onChange={(e) => setDependents(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Monthly EMIs
                    </label>
                    <Input
                      type="number"
                      value={monthlyEMIs}
                      onChange={(e) => setMonthlyEMIs(Number(e.target.value))}
                      placeholder="Total EMI amount"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Annual Insurance Premiums
                    </label>
                    <Input
                      type="number"
                      value={insurancePremiums}
                      onChange={(e) => setInsurancePremiums(Number(e.target.value))}
                      placeholder="Health + Motor + Term"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Buffer Percentage
                    </label>
                    <Input
                      type="number"
                      value={bufferPercentage}
                      onChange={(e) => setBufferPercentage(Number(e.target.value))}
                      placeholder="20"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Current Emergency Corpus
                    </label>
                    <Input
                      type="number"
                      value={currentCorpus}
                      onChange={(e) => setCurrentCorpus(Number(e.target.value))}
                      placeholder="Current savings"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="metric-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Monthly Requirement</h3>
                      <p className="text-sm text-muted-foreground">Including all factors</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    ₹{calculation.monthlyRequired.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Emergency Fund Target</h3>
                      <p className="text-sm text-muted-foreground">6 months coverage</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    ₹{calculation.emergencyFundRequired.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Current Coverage</h3>
                      <p className="text-sm text-muted-foreground">Months covered</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {calculation.currentCoverage} months
                  </div>
                </CardContent>
              </Card>

              <Card className="metric-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Shortfall</h3>
                      <p className="text-sm text-muted-foreground">Amount needed</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    ₹{calculation.shortfall.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {calculation.shortfall > 0 && (
              <Card className="metric-card border-border/50">
                <CardHeader>
                  <CardTitle>SIP Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Suggested Monthly SIP</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">12 months:</span>
                        <div className="font-semibold">₹{Math.round(calculation.shortfall / 12).toLocaleString()}/month</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24 months:</span>
                        <div className="font-semibold">₹{Math.round(calculation.shortfall / 24).toLocaleString()}/month</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">36 months:</span>
                        <div className="font-semibold">₹{Math.round(calculation.shortfall / 36).toLocaleString()}/month</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Recommended: Arbitrage or Conservative Hybrid funds for emergency corpus
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
