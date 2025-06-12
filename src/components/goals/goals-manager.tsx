
import { motion } from "framer-motion";
import { useState } from "react";
import { Target, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  category: 'long-term' | 'short-term';
  status: 'active' | 'completed' | 'abandoned';
}

const defaultGoals: Goal[] = [
  {
    id: '1',
    name: 'Child Education',
    targetAmount: 2500000,
    currentAmount: 450000,
    startDate: '2024-01-01',
    endDate: '2035-12-31',
    category: 'long-term',
    status: 'active'
  },
  {
    id: '2',
    name: 'Home Purchase',
    targetAmount: 8000000,
    currentAmount: 1200000,
    startDate: '2024-01-01',
    endDate: '2028-12-31',
    category: 'long-term',
    status: 'active'
  },
  {
    id: '3',
    name: 'Europe Trip',
    targetAmount: 300000,
    currentAmount: 85000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    category: 'short-term',
    status: 'active'
  }
];

export function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    endDate: '',
    category: 'short-term' as const
  });
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.endDate) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseInt(newGoal.targetAmount),
      currentAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: newGoal.endDate,
      category: newGoal.category,
      status: 'active'
    };

    setGoals([...goals, goal]);
    setNewGoal({ name: '', targetAmount: '', endDate: '', category: 'short-term' });
    setIsAddingGoal(false);
    
    toast({
      title: "Goal added successfully",
    });
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast({
      title: "Goal deleted",
    });
  };

  const longTermGoals = goals.filter(goal => goal.category === 'long-term' && goal.status === 'active');
  const shortTermGoals = goals.filter(goal => goal.category === 'short-term' && goal.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Goals</h2>
          <p className="text-muted-foreground">Track your financial objectives</p>
        </div>
        <Button
          onClick={() => setIsAddingGoal(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Add Goal Form */}
      {isAddingGoal && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="metric-card border-border/50">
            <CardHeader>
              <CardTitle>Add New Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Goal Name
                  </label>
                  <Input
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="e.g., Vacation to Japan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Target Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="200000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Target Date
                  </label>
                  <Input
                    type="date"
                    value={newGoal.endDate}
                    onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as 'long-term' | 'short-term' })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="short-term">Short-term (< 3 years)</option>
                    <option value="long-term">Long-term (> 3 years)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddGoal} className="flex-1">
                  Add Goal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingGoal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Long-term Goals */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Long-term Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {longTermGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {calculateProgress(goal.currentAmount, goal.targetAmount).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(goal.currentAmount, goal.targetAmount)} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Short-term Goals */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Short-term Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortTermGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="metric-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Target: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {calculateProgress(goal.currentAmount, goal.targetAmount).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={calculateProgress(goal.currentAmount, goal.targetAmount)} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Goals Yet</h3>
          <p className="text-muted-foreground mb-4">Start by adding your first financial goal</p>
          <Button onClick={() => setIsAddingGoal(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Goal
          </Button>
        </motion.div>
      )}
    </div>
  );
}
