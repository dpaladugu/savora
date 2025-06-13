
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
  goalType: 'Emergency Fund' | 'Child Education' | 'Home Purchase' | 'Retirement' | 'Travel' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  linkedInvestments?: string[];
}

export function SimpleGoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedGoals = localStorage.getItem('savora-goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  const saveGoals = (updatedGoals: Goal[]) => {
    localStorage.setItem('savora-goals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const handleAddGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
    };
    
    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Goal added successfully!",
    });
  };

  const updateGoalProgress = (goalId: string, newAmount: number) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId ? { ...goal, currentAmount: newAmount } : goal
    );
    saveGoals(updatedGoals);
  };

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const progressPercentage = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  if (showAddForm) {
    return <AddGoalForm onSubmit={handleAddGoal} onCancel={() => setShowAddForm(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Goals Tracker
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Track your financial goals and progress
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Target</span>
            </div>
            <div className="text-2xl font-bold text-foreground">₹{totalTargetAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Saved</span>
            </div>
            <div className="text-2xl font-bold text-foreground">₹{totalCurrentAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Progress</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{progressPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card className="metric-card border-border/50">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Goals Set</h3>
              <p className="text-muted-foreground mb-4">
                Create your first financial goal to start tracking progress
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysUntilDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={goal.id} className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{goal.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className={`px-2 py-1 rounded text-xs ${
                            goal.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {goal.priority} Priority
                          </span>
                          <span>{goal.goalType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="text-xl font-bold text-foreground">{progress.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <div className="font-semibold text-foreground">₹{goal.currentAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <div className="font-semibold text-foreground">₹{goal.targetAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <div className="font-semibold text-foreground">₹{remaining.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Deadline: </span>
                        <span className="font-medium text-foreground">
                          {new Date(goal.deadline).toLocaleDateString()} 
                          {daysUntilDeadline > 0 ? ` (${daysUntilDeadline} days)` : ' (Overdue)'}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newAmount = prompt('Update current amount:', goal.currentAmount.toString());
                          if (newAmount) {
                            updateGoalProgress(goal.id, Number(newAmount));
                          }
                        }}
                      >
                        Update Progress
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function AddGoalForm({ onSubmit, onCancel }: {
  onSubmit: (data: Omit<Goal, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    description: '',
    goalType: 'Other' as Goal['goalType'],
    priority: 'Medium' as Goal['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount),
      deadline: formData.deadline,
      description: formData.description,
      goalType: formData.goalType,
      priority: formData.priority,
      linkedInvestments: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Add New Goal
        </h1>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Goal Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Emergency Fund, Home Down Payment"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Target Amount</label>
                <Input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Current Amount</label>
                <Input
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Goal Type</label>
                <select
                  value={formData.goalType}
                  onChange={(e) => setFormData({...formData, goalType: e.target.value as Goal['goalType']})}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Child Education">Child Education</option>
                  <option value="Home Purchase">Home Purchase</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Travel">Travel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Goal['priority']})}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Deadline</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional details about this goal..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              Add Goal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
