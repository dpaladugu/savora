
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info, RefreshCw, Sparkles } from "lucide-react";
import aiChatServiceInstance, { AiAdviceResponse } from "@/services/AiChatService";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";

export function RecommendationsEngine() {
  const { toast } = useToast();
  const [query, setQuery] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<AiAdviceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(false);

  // Check AI configuration status from store
  useEffect(() => {
    const { decryptedAiApiKey, currentAiProvider } = useAppStore.getState();
    if (decryptedAiApiKey && currentAiProvider) {
        aiChatServiceInstance.initializeProvider();
    }
    setIsAiConfigured(!!decryptedAiApiKey && !!currentAiProvider);

    const unsubscribe = useAppStore.subscribe(
      (state) => {
        const configured = !!state.decryptedAiApiKey && !!state.currentAiProvider;
        setIsAiConfigured(configured);
        if (configured) {
          aiChatServiceInstance.initializeProvider();
        }
      }
    );
    return unsubscribe;
  }, []);

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      toast({ title: "Empty Query", description: "Please enter your financial question.", variant: "default" });
      return;
    }

    if (!aiChatServiceInstance.isConfigured()) {
      setError("AI Service is not configured. Please set up your API key and provider in PIN/Settings.");
      toast({
        title: "AI Service Not Configured",
        description: "Please ensure your AI provider and API key are set up correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const systemPrompt = "You are a helpful and insightful financial advisor. Provide clear, actionable advice based on the user's query. If the query is too vague, ask for clarification. Keep responses concise yet comprehensive.";
      const response = await aiChatServiceInstance.getFinancialAdvice(query, systemPrompt);
      setAiResponse(response);
    } catch (err: any) {
      console.error("Error fetching AI advice:", err);
      setError(err.message || "An unexpected error occurred while fetching advice.");
      toast({
        title: "Error Fetching Advice",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Financial Advisor
          </CardTitle>
          <CardDescription>
            Ask any financial question or describe a scenario to get AI-powered advice.
            The more context you provide in your query, the better the advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., 'Should I invest in mutual funds or pay off my debt first?', 'How can I save more for a down payment on a house?'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            disabled={isLoading || !isAiConfigured}
          />
          {!isAiConfigured && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> AI provider not configured. Please set it up via PIN/Settings.
            </p>
          )}
          <Button onClick={handleQuerySubmit} disabled={isLoading || !query.trim() || !isAiConfigured}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Getting Advice...
              </>
            ) : (
              "Get AI Advice"
            )}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-5 h-5" />
                Error
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {aiResponse?.advice && !isLoading && (
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
              Disclaimer: AI-generated advice is for informational purposes only and should not be considered professional financial advice. Always consult with a qualified financial advisor for personalized guidance.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
