
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Target } from "lucide-react"; // Removed TrendingUp as it's not used directly here
import { useToast } from "@/hooks/use-toast";
// import { GlobalHeader } from "@/components/layout/global-header"; // Removed
import { ModuleHeader } from "@/components/layout/module-header"; // Import ModuleHeader
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export function SimpleGoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved goals from localStorage
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

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (showAddForm) {
    return (
      <>
        <ModuleHeader
          title="Add New Goal"
          showBackButton
          onBack={() => setShowAddForm(false)}
        />
        <div className="px-4 py-4 space-y-6"> {/* Content padding for form */}
          <AddGoalForm onSubmit={handleAddGoal} onCancel={() => setShowAddForm(false)} />
        </div>
      </>
    );
  }

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // These are expected to be handled by the parent router using ModuleHeader.
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Title/subtitle would come from ModuleHeader via router config.
              This text is more of a description for the page content itself.
          */}
          <p className="text-muted-foreground text-base">
            Track your financial goals and progress.
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
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">₹{totalTarget.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Target</div>
            </CardContent>
          </Card>

          <Card className="metric-card border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">₹{totalSaved.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Saved</div>
            </CardContent>
          </Card>

          <Card className="metric-card border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
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
              const goalProgress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isCompleted = goalProgress >= 100;
              
              return (
                <Card key={goal.id} className="metric-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">
                          ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                        </div>
                        <div className={`text-sm ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                          {goalProgress.toFixed(1)}% {isCompleted ? 'Complete!' : 'Progress'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(goalProgress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                      <span>Shortfall: ₹{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
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
    currentAmount: '',
    deadline: '',
    category: 'Investment'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount) || 0,
      deadline: formData.deadline,
      category: formData.category
    });
  };

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // AddGoalForm is now rendered within a layout provided by SimpleGoalsTracker when showAddForm is true,
    // which includes a ModuleHeader.
    <Card className="metric-card border-border/50">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-foreground mb-2">Goal Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Target Amount</label>
                <Input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  placeholder="e.g., 500000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Current Amount (Optional)</label>
                <Input
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  required
                />
              </div>

              <div>
                <label htmlFor="goalCategory" className="block text-sm font-medium text-foreground mb-2">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger id="goalCategory" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Goal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
