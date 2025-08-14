
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TransactionList } from '@/components/transactions/transaction-list';
import { QuickAddForm } from '@/components/transactions/quick-add-form';

interface ProtectedDashboardProps {
  onSignOut: () => void;
}

export function ProtectedDashboard({ onSignOut }: ProtectedDashboardProps) {
  const { toast } = useToast();
  const [privacyMasked, setPrivacyMasked] = useState(true);
  const [authStatus, setAuthStatus] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      setAuthStatus(isAuth);
      setIsSessionValid(isAuth);
    };

    checkAuth();
    
    // Check session validity periodically
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleTogglePrivacy = () => {
    if (!privacyMasked) {
      // Turning privacy mask ON
      setPrivacyMasked(true);
      toast({
        title: "Privacy Mode Enabled",
        description: "Financial data is now masked for privacy.",
      });
    } else {
      // Turning privacy mask OFF - would normally require authentication
      setPrivacyMasked(false);
      toast({
        title: "Privacy Mode Disabled",
        description: "Financial data is now visible.",
      });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    setAuthStatus(false);
    setIsSessionValid(false);
    onSignOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  // Show loading if authentication status is being checked
  if (!authStatus || !isSessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Shield className="w-12 h-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground text-center">
              Please sign in to access your financial dashboard.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Savora Finance</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePrivacy}
                className="flex items-center space-x-2"
              >
                {privacyMasked ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Show Amounts</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Hide Amounts</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Add Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Add Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickAddForm />
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList privacyMasked={privacyMasked} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {privacyMasked ? '₹••,•••' : '₹1,23,456'}
              </div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {privacyMasked ? '₹••,•••' : '₹45,678'}
              </div>
              <p className="text-xs text-muted-foreground">-5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {privacyMasked ? '₹••,•••' : '₹2,34,567'}
              </div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67%</div>
              <p className="text-xs text-muted-foreground">3 of 5 goals on track</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
