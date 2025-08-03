
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthenticationService } from "@/services/AuthenticationService";
import { GlobalSettingsService } from "@/services/GlobalSettingsService";
import { db } from "@/lib/db";
import { Eye, EyeOff, TrendingUp, PiggyBank, CreditCard, Target } from "lucide-react";

interface DashboardStats {
  totalExpenses: number;
  totalInvestments: number;
  emergencyFund: number;
  activeGoals: number;
}

export function ProtectedDashboard() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [privacyMask, setPrivacyMask] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalInvestments: 0,
    emergencyFund: 0,
    activeGoals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await AuthenticationService.checkAuthenticationStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
        
        if (authStatus.isAuthenticated) {
          await loadDashboardData();
          await loadPrivacySettings();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [txns, investments, emergencyFunds, goals] = await Promise.all([
        db.txns.toArray(),
        db.investments.toArray(),
        db.emergencyFunds.toArray(),
        db.goals.toArray()
      ]);

      const totalExpenses = txns
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalInvestments = investments
        .reduce((sum, inv) => sum + inv.currentValue, 0);

      const emergencyFund = emergencyFunds
        .reduce((sum, fund) => sum + fund.currentAmount, 0);

      setStats({
        totalExpenses,
        totalInvestments,
        emergencyFund,
        activeGoals: goals.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const settings = await GlobalSettingsService.getSettings();
      setPrivacyMask(settings.privacyMask);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const togglePrivacyMask = () => {
    setPrivacyMask(!privacyMask);
  };

  const formatAmount = (amount: number): string => {
    if (privacyMask) {
      return "₹****";
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Savora Dashboard</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePrivacyMask}
              className="flex items-center gap-2"
            >
              {privacyMask ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {privacyMask ? 'Show' : 'Hide'} Amounts
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalInvestments)}</div>
              <p className="text-xs text-muted-foreground">Current value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Fund</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.emergencyFund)}</div>
              <p className="text-xs text-muted-foreground">Available now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGoals}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Welcome to Savora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your personal finance dashboard is ready. All your financial data is stored securely on your device.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Privacy-first: All amounts can be masked for security</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PiggyBank className="h-4 w-4" />
                <span>Offline-first: Works without internet connection</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
