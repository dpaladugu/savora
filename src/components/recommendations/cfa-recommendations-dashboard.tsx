
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Target, PieChart, BarChart3, Brain, Lightbulb, Star
} from 'lucide-react';
import { CFARecommendationEngine } from '@/services/CFARecommendationEngine';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';

interface Recommendation {
  id: string;
  type: 'portfolio' | 'tax' | 'risk' | 'goal' | 'cash_flow';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  confidenceScore: number;
  category: string;
  expectedReturn?: number;
  riskLevel?: string;
}

interface PortfolioAnalysis {
  assetAllocation: Record<string, number>;
  riskScore: number;
  expectedReturn: number;
  sharpeRatio: number;
  diversificationScore: number;
  rebalanceNeeded: boolean;
}

export function CFARecommendationsDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const [recs, analysis] = await Promise.all([
        CFARecommendationEngine.generateRecommendations(),
        CFARecommendationEngine.analyzePortfolio()
      ]);
      setRecommendations(recs);
      setPortfolioAnalysis(analysis);
    } catch (error) {
      toast.error('Failed to load recommendations');
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === selectedCategory);

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading CFA recommendations...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            CFA-Level Financial Recommendations
          </h1>
          <p className="text-muted-foreground">Professional-grade portfolio analysis and recommendations</p>
        </div>
        <Button onClick={loadRecommendations} className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Refresh Analysis
        </Button>
      </div>

      {/* Portfolio Health Overview */}
      {portfolioAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioAnalysis.riskScore.toFixed(1)}/10</div>
              <Progress value={portfolioAnalysis.riskScore * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Expected Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioAnalysis.expectedReturn.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Annual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Sharpe Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioAnalysis.sharpeRatio.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Diversification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioAnalysis.diversificationScore.toFixed(0)}%</div>
              <Progress value={portfolioAnalysis.diversificationScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rebalancing Alert */}
      {portfolioAnalysis?.rebalanceNeeded && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your portfolio requires rebalancing. Some asset classes are significantly over or under-weighted.
          </AlertDescription>
        </Alert>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Recommendations
        </Button>
        <Button
          variant={selectedCategory === 'portfolio' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('portfolio')}
        >
          Portfolio
        </Button>
        <Button
          variant={selectedCategory === 'tax' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('tax')}
        >
          Tax Optimization
        </Button>
        <Button
          variant={selectedCategory === 'risk' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('risk')}
        >
          Risk Management
        </Button>
        <Button
          variant={selectedCategory === 'goal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('goal')}
        >
          Goal Planning
        </Button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No recommendations available. Ensure you have sufficient financial data for analysis.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getPriorityIcon(rec.priority)}
                    <div>
                      <h3 className="font-semibold text-lg">{rec.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority} priority
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {rec.confidenceScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {rec.expectedReturn && (
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        +{rec.expectedReturn.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Expected impact</p>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">{rec.description}</p>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Impact:</h4>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">{rec.impact}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Action Items:</h4>
                  <ul className="space-y-1">
                    {rec.actionItems.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {rec.riskLevel && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Risk Level: </span>
                    <Badge variant="outline">{rec.riskLevel}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
