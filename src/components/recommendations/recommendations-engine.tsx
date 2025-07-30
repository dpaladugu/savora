
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info, RefreshCw, Sparkles, TrendingUp, Shield, CreditCard, PiggyBank, Receipt } from "lucide-react";
import aiChatServiceInstance, { AiAdviceResponse } from "@/services/AiChatService";
import { RecommendationService, type Recommendation } from "@/services/RecommendationService";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'investment': return TrendingUp;
    case 'insurance': return Shield;
    case 'loan': return CreditCard;
    case 'expense': return Receipt;
    case 'tax': return PiggyBank;
    default: return Info;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-red-500 bg-red-50';
    case 'medium': return 'border-yellow-500 bg-yellow-50';
    case 'low': return 'border-blue-500 bg-blue-50';
    default: return 'border-gray-500 bg-gray-50';
  }
};

export function RecommendationsEngine() {
  const { toast } = useToast();
  const [query, setQuery] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<AiAdviceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

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

  // Load expert recommendations on component mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const expertRecommendations = await RecommendationService.generateRecommendations();
      setRecommendations(expertRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error Loading Recommendations",
        description: "Failed to load expert recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      toast({ title: "Empty Query", description: "Please enter your financial question.", variant: "default" });
      return;
    }

    if (!aiChatServiceInstance.isConfigured()) {
      toast({
        title: "AI Service Not Configured",
        description: "Please ensure your AI provider and API key are set up correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAiResponse(null);

    try {
      const systemPrompt = "You are a helpful and insightful financial advisor. Provide clear, actionable advice based on the user's query. If the query is too vague, ask for clarification. Keep responses concise yet comprehensive.";
      const response = await aiChatServiceInstance.getFinancialAdvice(query, systemPrompt);
      setAiResponse(response);
    } catch (err: any) {
      console.error("Error fetching AI advice:", err);
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
      {/* Expert Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Expert Recommendations
            </span>
            <Button 
              onClick={loadRecommendations} 
              disabled={loadingRecommendations}
              variant="outline"
              size="sm"
            >
              {loadingRecommendations ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            CFA-level financial recommendations based on your current portfolio and spending patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecommendations ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recommendations available. Add some financial data to get personalized advice.
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => {
                const Icon = getRecommendationIcon(rec.type);
                return (
                  <Card key={rec.id} className={`${getPriorityColor(rec.priority)} border-l-4`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          {rec.action && (
                            <p className="text-sm font-medium mt-2 text-blue-700">
                              Action: {rec.action}
                              {rec.amount && ` (₹${rec.amount.toLocaleString()})`}
                            </p>
                          )}
                          {rec.dueDate && (
                            <p className="text-xs text-orange-600 mt-1">
                              Due: {rec.dueDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Financial Advisor Section */}
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
