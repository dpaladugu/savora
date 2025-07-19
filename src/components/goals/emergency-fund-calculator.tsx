
import { GlobalHeader } from "@/components/layout/global-header";
import { useEmergencyFund } from "@/hooks/use-emergency-fund";
import { MissingDataAlert } from "./missing-data-alert";
import { EmergencyFundForm } from "./emergency-fund-form";
import { EmergencyFundResults } from "./emergency-fund-results";
import { SipRecommendation } from "./sip-recommendation";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { LoadingWrapper } from "@/components/ui/loading-wrapper";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import aiChatServiceInstance, { AiAdviceResponse } from "@/services/AiChatService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/components/ui/use-toast";

export function EmergencyFundCalculator() {
  const { data, updateData, loading: initialDataLoading, missingData, calculation, refreshData } = useEmergencyFund();
  const { toast } = useToast();
  const [aiResponse, setAiResponse] = useState<AiAdviceResponse | null>(null);
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdviceError, setAiAdviceError] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);

  useEffect(() => {
    const { decryptedAiApiKey, currentAiProvider } = useAppStore.getState();
    // Initialize provider, this will be re-checked by isConfigured() before actual call
    if (decryptedAiApiKey && currentAiProvider) {
        aiChatServiceInstance.initializeProvider();
    }
    setIsAiConfigured(!!decryptedAiApiKey && !!currentAiProvider);

    const unsubscribe = useAppStore.subscribe(
      (state) => {
        const configured = !!state.decryptedAiApiKey && !!state.currentAiProvider;
        setIsAiConfigured(configured);
        if (configured) {
            // Re-initialize if relevant parts of store change
            aiChatServiceInstance.initializeProvider();
        }
      }
    );
    return unsubscribe;
  }, []);

  const handleGetAiAdvice = async () => {
    if (!aiChatServiceInstance.isConfigured()) {
      setAiAdviceError("AI Service is not configured. Please set up the API key and provider in settings/PIN setup.");
      toast({
        title: "AI Service Not Configured",
        description: "Please ensure your AI provider and API key are set up correctly.",
        variant: "destructive",
      });
      return;
    }

    setAiAdviceLoading(true);
    setAiAdviceError(null);
    setAiResponse(null);

    const prompt = `
You are an expert financial advisor AI. Your goal is to provide clear, actionable, and prudent advice regarding a user's emergency fund. Your advice should be based on established financial planning best practices.

Consider the following user data:
- Average Monthly Essential Expenses: ${data.monthlyExpenses}
- Number of Dependents: ${data.dependents}
- Number of Income Earners in Household: ${data.numIncomeSources || 1}
- Assessed Job Stability: ${data.jobStability || 'medium'}
- Current Emergency Fund Savings: ${data.currentCorpus}
- Other Readily Available Liquid Savings (not part of emergency fund): ${data.otherLiquidSavings || 0}
- Significant Monthly Debt Payments (e.g., loans, EMIs, excluding rent/mortgage which is in monthly expenses): ${data.monthlyEMIs}
- Annual Insurance Premiums (total for term, health, motor, etc.): ${data.insurancePremiums}
- Monthly Rental Income (if any, this can offset expenses): ${data.rentalIncome || 0}
- User's Preferred Emergency Fund Size (in months of expenses): ${data.emergencyMonths}
- User's Risk Tolerance for Emergency Fund Size: ${data.efRiskTolerance || 'moderate'}
- User's Preferred Expense Buffer Percentage: ${data.bufferPercentage}%

Based on this data, please provide the following in a structured format (e.g., using Markdown headings):

1.  **Calculated Monthly Need:**
    *   Calculate the adjusted monthly essential expenses by adding the user's preferred buffer: Adjusted Monthly Expenses = ${data.monthlyExpenses} * (1 + ${data.bufferPercentage}/100).
    *   Calculate the net monthly amount needed for the emergency fund core calculation: Net Monthly Core Need = (Adjusted Monthly Expenses) + ${data.monthlyEMIs} + (${data.insurancePremiums} / 12) - ${data.rentalIncome || 0}. State this calculated Net Monthly Core Need.

2.  **Recommended Emergency Fund Target Range:**
    *   Considering factors like job stability, number of dependents, income sources, and the user's risk tolerance, recommend a target range for their emergency fund in terms of months of 'Net Monthly Core Need' (e.g., "3-6 months", "6-9 months").
    *   Justify your recommendation briefly, explaining how these factors influence the range.

3.  **Assessment of Current Situation:**
    *   Calculate the total recommended emergency fund amount based on the lower and upper end of your recommended range from point 2.
    *   Compare the user's Current Emergency Fund Savings (${data.currentCorpus}) against this recommended target range.
    *   State clearly whether they are below, within, or above the recommended range.
    *   Calculate how many months of 'Net Monthly Core Need' their Current Emergency Fund Savings (${data.currentCorpus}) covers.

4.  **Actionable Advice:**
    *   If below target: Provide 2-3 concise, actionable suggestions on how to build up their emergency fund.
    *   If within target: Congratulate them. Suggest they review the fund size annually or if circumstances change.
    *   If above target: Congratulate them. Suggest they consider moving the excess amount to other financial goals. Also, mention the Other Readily Available Liquid Savings (${data.otherLiquidSavings || 0}) and how that might factor into their overall liquidity, but emphasize the dedicated nature of an emergency fund.

5.  **Where to Keep the Emergency Fund:**
    *   Briefly recommend keeping the emergency fund in safe, liquid accounts.

Output Format Guidance:
Please use Markdown for formatting your response, including headings for each section (e.g., \`## Recommended Emergency Fund Target Range\`). Make the advice easy to read and understand. Be encouraging and practical.
    `;

    try {
      const response = await aiChatServiceInstance.getFinancialAdvice(prompt.trim(), "You are a helpful financial planning assistant.");
      setAiResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        setAiAdviceError(error.message);
      } else {
        setAiAdviceError("An unknown error occurred while fetching AI advice.");
      }
    } finally {
      setAiAdviceLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <LoadingWrapper
          loading={initialDataLoading}
          loadingText="Loading data from your financial modules..."
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Data integrated from: Expenses, Insurance, EMI & Rental modules
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="gap-2"
              disabled={aiAdviceLoading || initialDataLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </div>

          <MissingDataAlert missingData={missingData} />
          <EmergencyFundForm data={data} onUpdate={updateData} />
          <EmergencyFundResults calculation={calculation} emergencyMonths={data.emergencyMonths} />
          <SipRecommendation shortfall={calculation.shortfall} />

          {/* AI Advice Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Financial Advisor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get personalized advice on your emergency fund based on your current data.
                Remember, this is AI-generated information and not professional financial advice.
              </p>
              <Button
                onClick={handleGetAiAdvice}
                disabled={!isAiConfigured || aiAdviceLoading || initialDataLoading}
              >
                {aiAdviceLoading ? "Getting Advice..." : "Get AI Emergency Fund Advice"}
              </Button>
              {!isAiConfigured && (
                <p className="text-xs text-destructive">AI provider not configured. Please set it up in PIN/Settings.</p>
              )}

              {aiAdviceLoading && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fetching recommendations...</span>
                </div>
              )}

              {aiAdviceError && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-semibold">Error Fetching Advice</h4>
                  </div>
                  <p className="text-sm mt-1">{aiAdviceError}</p>
                </div>
              )}

              {aiResponse?.advice && !aiAdviceLoading && (
                <Card className="bg-background/50 p-4 border">
                  <h4 className="font-semibold text-lg mb-2">AI Generated Advice:</h4>
                  <pre className="whitespace-pre-wrap text-sm font-sans bg-muted p-3 rounded-md overflow-x-auto">
                    {aiResponse.advice}
                  </pre>
                  {aiResponse.usage && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <p className="flex items-center gap-1"><Info className="w-3 h-3" /> Token Usage:</p>
                      <ul>
                        <li>Prompt Tokens: {aiResponse.usage.prompt_tokens}</li>
                        <li>Completion Tokens: {aiResponse.usage.completion_tokens}</li>
                        <li>Total Tokens: {aiResponse.usage.total_tokens}</li>
                      </ul>
                    </div>
                  )}
                </Card>
              )}
              <p className="text-xs text-muted-foreground italic mt-4">
                Disclaimer: AI-generated advice is for informational purposes only and should not be considered professional financial advice. Always consult with a qualified financial advisor for personalized guidance. Ensure your API key and usage comply with the AI provider's terms of service.
              </p>
            </CardContent>
          </Card>
        </LoadingWrapper>
      </div>
    </ErrorBoundary>
  );
}
