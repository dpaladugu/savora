
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Shield, 
  PiggyBank, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  RefreshCw,
  Sparkles
} from "lucide-react";

// Import our CFA services
import { CFARecommendationEngine } from "@/services/CFARecommendationEngine";
import type { 
  RebalanceRecommendation, 
  InsuranceGap, 
  SIPRecommendation,
  TaxRecommendation,
  PrepaymentAdvice,
  MonthlyNudge 
} from "@/services/CFARecommendationEngine";

import { AutoGoalEngine } from "@/services/AutoGoalEngine";
import { LLMPromptService } from "@/services/LLMPromptService";
import type { Goal } from "@/lib/db";

interface CFARecommendationsState {
  rebalanceRecommendations: RebalanceRecommendation[];
  insuranceGaps: InsuranceGap[];
  sipRecommendations: SIPRecommendation[];
  taxRecommendations: TaxRecommendation[];
  prepaymentAdvice: PrepaymentAdvice[];
  monthlyNudges: MonthlyNudge[];
  autoCreatedGoals: Goal[];
}

export function CFARecommendationsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<CFARecommendationsState>({
    rebalanceRecommendations: [],
    insuranceGaps: [],
    sipRecommendations: [],
    taxRecommendations: [],
    prepaymentAdvice: [],
    monthlyNudges: [],
    autoCreatedGoals: []
  });
  const [llmPrompt, setLlmPrompt] = useState<string>("");

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Load all CFA-level recommendations in parallel
      const [
        rebalanceRecs,
        insuranceGaps,
        sipRecs,
        taxRecs,
        prepaymentAdvice,
        monthlyNudges,
        autoGoals
      ] = await Promise.all([
        CFARecommendationEngine.checkRebalancingNeeds(),
        CFARecommendationEngine.analyzeInsuranceGaps(1000000), // Default 10L income
        CFARecommendationEngine.getSIPRecommendations(),
        CFARecommendationEngine.getTaxOptimizationSuggestions(),
        CFARecommendationEngine.analyzeLoanPrepayments(),
        CFARecommendationEngine.generateMonthlyNudges(),
        AutoGoalEngine.executeAutoGoalCreation()
      ]);

      setRecommendations({
        rebalanceRecommendations: rebalanceRecs,
        insuranceGaps,
        sipRecommendations: sipRecs,
        taxRecommendations: taxRecs,
        prepaymentAdvice,
        monthlyNudges,
        autoCreatedGoals: autoGoals
      });

      // Generate LLM prompt
      const prompt = await LLMPromptService.generateComprehensivePrompt();
      setLlmPrompt(prompt);

    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: "Error loading recommendations",
        description: "Please try refreshing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
    toast({
      title: "Recommendations updated",
      description: "Latest CFA-level analysis completed",
      variant: "default"
    });
  };

  const copyLLMPrompt = async () => {
    try {
      await navigator.clipboard.writeText(llmPrompt);
      toast({
        title: "LLM Prompt copied",
        description: "Paste into ChatGPT for AI financial analysis",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually select and copy the prompt",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "destructive" | "default" | "secondary" => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTotalRecommendations = () => {
    return recommendations.rebalanceRecommendations.length +
           recommendations.insuranceGaps.length +
           recommendations.sipRecommendations.length +
           recommendations.taxRecommendations.length +
           recommendations.prepaymentAdvice.length +
           recommendations.monthlyNudges.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading CFA-level analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                CFA-Level Financial Recommendations
              </CardTitle>
              <CardDescription>
                Professional-grade financial advice powered by CFA curriculum standards
              </CardDescription>
            </div>
            <Button
              onClick={refreshRecommendations}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{getTotalRecommendations()}</div>
              <div className="text-sm text-muted-foreground">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recommendations.autoCreatedGoals.length}</div>
              <div className="text-sm text-muted-foreground">Auto-Created Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {recommendations.rebalanceRecommendations.length + recommendations.insuranceGaps.length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recommendations.taxRecommendations.length}</div>
              <div className="text-sm text-muted-foreground">Tax Optimizations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Tabs */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="nudges">Nudges</TabsTrigger>
          <TabsTrigger value="ai-prompt">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Asset Allocation & Rebalancing
              </CardTitle>
              <CardDescription>
                CFA-recommended portfolio allocation based on age and risk profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.rebalanceRecommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Your portfolio allocation is optimal!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.rebalanceRecommendations.map((rec) => (
                    <Card key={rec.id} className={`border-l-4 ${getPriorityColor(rec.priority)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant={getPriorityBadgeVariant(rec.priority)}>{rec.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                        <p className="text-sm font-medium mb-3">{rec.action}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Current Allocation:</span>
                            <div>Equity: {rec.currentAllocation.equity}%</div>
                            <div>Debt: {rec.currentAllocation.debt}%</div>
                            <div>Gold: {rec.currentAllocation.gold}%</div>
                          </div>
                          <div>
                            <span className="font-medium">Target Allocation:</span>
                            <div>Equity: {rec.targetAllocation.equity}%</div>
                            <div>Debt: {rec.targetAllocation.debt}%</div>
                            <div>Gold: {rec.targetAllocation.gold}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Insurance Gap Analysis
              </CardTitle>
              <CardDescription>
                CFA risk management principles applied to your insurance coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.insuranceGaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Your insurance coverage is adequate!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.insuranceGaps.map((gap) => (
                    <Card key={gap.id} className={`border-l-4 ${getPriorityColor(gap.priority)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{gap.title}</h4>
                          <Badge variant={getPriorityBadgeVariant(gap.priority)}>{gap.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{gap.description}</p>
                        <p className="text-sm font-medium mb-3">{gap.action}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Current:</span>
                            <div>₹{gap.currentCoverage.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Recommended:</span>
                            <div>₹{gap.recommendedCoverage.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Gap:</span>
                            <div className="text-red-600">₹{gap.gapAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                SIP & Investment Recommendations
              </CardTitle>
              <CardDescription>
                Systematic investment planning based on CFA portfolio theory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.sipRecommendations.map((sip) => (
                  <Card key={sip.id} className={`border-l-4 ${getPriorityColor(sip.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{sip.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(sip.priority)}>{sip.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{sip.description}</p>
                      <p className="text-sm font-medium mb-3">{sip.action}</p>
                      <div className="text-xs text-muted-foreground">
                        Reason: {sip.reason}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tax Optimization (New Regime)
              </CardTitle>
              <CardDescription>
                Maximize tax efficiency under India's New Tax Regime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.taxRecommendations.map((tax) => (
                  <Card key={tax.id} className={`border-l-4 ${getPriorityColor(tax.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{tax.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(tax.priority)}>{tax.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{tax.description}</p>
                      <p className="text-sm font-medium mb-3">{tax.action}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Tax Saving:</span>
                          <div className="text-green-600">₹{tax.potentialSaving.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Investment Needed:</span>
                          <div>₹{tax.investmentRequired.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {tax.deadline && (
                        <div className="mt-2 text-xs text-orange-600">
                          Deadline: {tax.deadline.toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nudges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Monthly Financial Nudges
              </CardTitle>
              <CardDescription>
                Time-sensitive actions to keep your finances on track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.monthlyNudges.map((nudge) => (
                  <Card key={nudge.id} className={`border-l-4 ${getPriorityColor(nudge.priority)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{nudge.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(nudge.priority)}>{nudge.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{nudge.description}</p>
                      <p className="text-sm font-medium">{nudge.action}</p>
                      
                      {nudge.dueDate && (
                        <div className="mt-2 text-xs text-orange-600">
                          Due: {nudge.dueDate.toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Privacy-First AI Analysis
              </CardTitle>
              <CardDescription>
                Anonymous financial prompt for external LLM analysis (ChatGPT, Claude, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    This prompt contains no personal information - only anonymized financial ratios and percentages.
                  </p>
                  <Button onClick={copyLLMPrompt} size="sm" variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
                    {llmPrompt}
                  </pre>
                </div>
                
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <p className="mb-2"><strong>How to use:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the above prompt</li>
                    <li>Open ChatGPT, Claude, or any LLM</li>
                    <li>Paste the prompt and ask for financial advice</li>
                    <li>Get personalized recommendations based on your anonymous data</li>
                  </ol>
                  <p className="mt-2">
                    <strong>Privacy:</strong> Zero personal information is shared. Only anonymized percentages and ratios are included.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
