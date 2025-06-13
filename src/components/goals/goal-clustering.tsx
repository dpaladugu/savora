
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Lightbulb } from "lucide-react";
import { RecurringGoal } from "./recurring-goals";

interface GoalClusteringProps {
  goals: RecurringGoal[];
  onCreateCluster: (clusterGoals: RecurringGoal[], sipAmount: number) => void;
}

interface GoalCluster {
  id: string;
  goals: RecurringGoal[];
  suggestedSIP: number;
  fundType: string;
  dueWindow: string;
}

export function GoalClustering({ goals, onCreateCluster }: GoalClusteringProps) {
  const [clusters, setClusters] = useState<GoalCluster[]>([]);

  useEffect(() => {
    // Find goals that can be clustered
    const clusterableGoals = goals.filter(goal => {
      const daysUntilDue = getDaysUntilDue(goal.nextDueDate);
      return daysUntilDue <= 45 && daysUntilDue >= 30;
    });

    // Group by fund type and due date proximity
    const groupedGoals: Record<string, RecurringGoal[]> = {};
    
    clusterableGoals.forEach(goal => {
      const key = `${goal.suggestedSIPType}_${Math.floor(getDaysUntilDue(goal.nextDueDate) / 15)}`;
      if (!groupedGoals[key]) {
        groupedGoals[key] = [];
      }
      groupedGoals[key].push(goal);
    });

    // Create clusters with 2+ goals
    const newClusters: GoalCluster[] = Object.entries(groupedGoals)
      .filter(([_, goals]) => goals.length >= 2)
      .map(([key, goals], index) => {
        const totalAmount = goals.reduce((sum, goal) => sum + goal.amount, 0);
        const avgDaysUntilDue = goals.reduce((sum, goal) => sum + getDaysUntilDue(goal.nextDueDate), 0) / goals.length;
        const monthlySIP = totalAmount / Math.max(avgDaysUntilDue / 30, 1);
        
        return {
          id: `cluster_${index}`,
          goals,
          suggestedSIP: monthlySIP,
          fundType: goals[0].suggestedSIPType,
          dueWindow: `${Math.floor(avgDaysUntilDue)} days`
        };
      });

    setClusters(newClusters);
  }, [goals]);

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getFundTypeColor = (fundType: string) => {
    const colors: Record<string, string> = {
      'Liquid': 'bg-blue-500',
      'Arbitrage': 'bg-green-500',
      'Flexi Cap': 'bg-purple-500',
      'Gold': 'bg-yellow-500',
    };
    return colors[fundType] || 'bg-gray-500';
  };

  if (clusters.length === 0) return null;

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Smart Goal Clustering Available
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                We found {clusters.length} opportunity(ies) to simplify your SIP management
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {clusters.map((cluster) => (
        <Card key={cluster.id} className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              Clustered Goals ({cluster.goals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Due in ~{cluster.dueWindow}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getFundTypeColor(cluster.fundType)}`} />
                <span className="text-sm">{cluster.fundType} Fund</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Included Goals:</h4>
              {cluster.goals.map((goal) => (
                <div key={goal.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                  <span className="text-sm">{goal.name}</span>
                  <span className="text-sm font-medium">₹{goal.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Optimized SIP Suggestion</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Instead of {cluster.goals.length} separate SIPs, invest
              </div>
              <div className="text-lg font-bold text-foreground">
                ₹{Math.round(cluster.suggestedSIP).toLocaleString()}/month
              </div>
              <div className="text-sm text-muted-foreground">
                in {cluster.fundType} Fund for all {cluster.goals.length} goals
              </div>
            </div>

            <Button
              onClick={() => onCreateCluster(cluster.goals, cluster.suggestedSIP)}
              className="w-full"
            >
              Create Clustered SIP
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
