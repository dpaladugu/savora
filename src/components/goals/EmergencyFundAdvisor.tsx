import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { useEmergencyFund } from '@/hooks/use-emergency-fund';
import aiChatServiceInstance from '@/services/AiChatService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from '@/lib/format-utils';

export function EmergencyFundAdvisor() {
  const { data, calculation, loading, missingData, refreshData } = useEmergencyFund();
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGetAdvice = async () => {
    setIsAiLoading(true);
    setAiError('');
    setAiAdvice('');

    const promptContext = `
      Analyze the user's emergency fund status and provide actionable advice.
      The user wants to build their emergency fund and then start saving for other goals.
      Keep the advice concise, positive, and broken down into 2-3 clear, actionable steps.
      Format the response as simple markdown.

      User's Financial Summary:
      - Desired Emergency Fund Coverage: ${data.emergencyMonths} months
      - Calculated Monthly Essential Expenses: ${formatCurrency(calculation.monthlyRequired)}
      - Target Emergency Fund: ${formatCurrency(calculation.emergencyFundRequired)}
      - Current Emergency Fund Savings: ${formatCurrency(data.currentCorpus)}
      - Shortfall: ${formatCurrency(calculation.shortfall)}
      - Number of Income Sources: ${data.numIncomeSources}
      - Job Stability: ${data.jobStability}
      - Risk Tolerance for EF Investments: ${data.efRiskTolerance}
    `;

    try {
      if (!aiChatServiceInstance.isConfigured()) {
        throw new Error("AI Service is not configured. Please set up your API key in settings.");
      }
      const response = await aiChatServiceInstance.getFinancialAdvice(promptContext, "You are a helpful financial advisor specializing in goal-based savings for a user in India.");
      setAiAdvice(response.advice);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setAiError(errorMessage);
      console.error("Failed to get AI advice:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="ml-2">Loading financial data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Fund Advisor</CardTitle>
        <CardDescription>
          Your emergency fund is a critical safety net. Let's see how you're doing and get some AI-powered advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Target Fund</p>
            <p className="text-2xl font-bold">{formatCurrency(calculation.emergencyFundRequired)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Savings</p>
            <p className="text-2xl font-bold">{formatCurrency(data.currentCorpus)}</p>
          </div>
          <div className={`p-4 rounded-lg ${calculation.shortfall > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
            <p className={`text-sm ${calculation.shortfall > 0 ? 'text-destructive' : 'text-success'}`}>
              {calculation.shortfall > 0 ? 'Shortfall' : 'Surplus'}
            </p>
            <p className={`text-2xl font-bold ${calculation.shortfall > 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(calculation.shortfall)}
            </p>
          </div>
        </div>

        {missingData.length > 0 && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>For Better Advice</AlertTitle>
            <AlertDescription>
              Your advice will be more accurate if you provide the following data:
              <ul className="list-disc pl-5 mt-2 text-xs">
                {missingData.map(item => <li key={item}>{item}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Button onClick={handleGetAdvice} disabled={isAiLoading} className="w-full">
            {isAiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Get AI-Powered Advice
          </Button>
        </div>

        {aiError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        )}

        {aiAdvice && (
          <div className="p-4 border rounded-lg bg-background prose dark:prose-invert max-w-none">
            {/* Using a simple renderer for markdown. A library like 'react-markdown' would be better for full support. */}
            {aiAdvice.split('\n').map((line, index) => {
              if (line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.substring(2)}</li>;
              }
              if (line.trim() === '') {
                return <br key={index} />;
              }
              return <p key={index}>{line}</p>;
            })}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
