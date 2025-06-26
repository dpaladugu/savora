import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, RefreshCw } from 'lucide-react';
import { TokenUsageService } from '@/services/token-usage-service';
import { Button } from '@/components/ui/button';

// User-configurable limits (ideally from a settings context or .env, hardcoded for now)
const DAILY_TOKEN_LIMIT_ESTIMATE = 100000; // Example: 100k tokens
const MONTHLY_TOKEN_LIMIT_ESTIMATE = 1000000; // Example: 1M tokens

export function AiTokenUsageDisplay() {
  const [dailyUsage, setDailyUsage] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

  const fetchUsage = () => {
    setDailyUsage(TokenUsageService.getCurrentDailyUsage());
    setMonthlyUsage(TokenUsageService.getCurrentMonthlyUsage());
  };

  useEffect(() => {
    fetchUsage();
    // Optional: Add an event listener if usage might be updated from other tabs/windows
    // window.addEventListener('storage', handleStorageChange);
    // return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // const handleStorageChange = (event: StorageEvent) => {
  //   if (event.key === 'savoraAiTokenUsage') {
  //     fetchUsage();
  //   }
  // };

  const getProgressColor = (current: number, limit: number) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleResetUsage = () => {
    if (window.confirm("Are you sure you want to reset all AI token usage history? This cannot be undone.")) {
      TokenUsageService.resetAllUsage();
      fetchUsage(); // Refresh display
    }
  };

  return (
    <Card className="metric-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            AI Token Usage
          </div>
          <Button variant="ghost" size="sm" onClick={fetchUsage} aria-label="Refresh usage">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="flex justify-between mb-1">
            <span>Today's Usage:</span>
            <span className="font-semibold">{dailyUsage.toLocaleString()} / {DAILY_TOKEN_LIMIT_ESTIMATE.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor(dailyUsage, DAILY_TOKEN_LIMIT_ESTIMATE)}`}
              style={{ width: `${Math.min((dailyUsage / DAILY_TOKEN_LIMIT_ESTIMATE) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span>This Month's Usage:</span>
            <span className="font-semibold">{monthlyUsage.toLocaleString()} / {MONTHLY_TOKEN_LIMIT_ESTIMATE.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor(monthlyUsage, MONTHLY_TOKEN_LIMIT_ESTIMATE)}`}
              style={{ width: `${Math.min((monthlyUsage / MONTHLY_TOKEN_LIMIT_ESTIMATE) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="pt-2 text-center">
            <Button variant="link" size="sm" onClick={handleResetUsage} className="text-xs text-muted-foreground hover:text-destructive">
                Reset All Usage Data
            </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Note: Limits are estimates. Please refer to your Deepseek API dashboard for official usage. Usage is tracked locally in your browser.
        </p>
      </CardContent>
    </Card>
  );
}
