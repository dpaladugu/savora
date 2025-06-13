
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Target, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export interface RecurringGoal {
  id: string;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextDueDate: string;
  category: 'Insurance' | 'Tax' | 'EMI' | 'Investment' | 'Other';
  suggestedSIPType: 'Liquid' | 'Arbitrage' | 'Flexi Cap' | 'Gold';
  currentSavings: number;
  isGrouped: boolean;
  groupId?: string;
}

const mockRecurringGoals: RecurringGoal[] = [
  {
    id: '1',
    name: 'Car Insurance Premium',
    amount: 25000,
    frequency: 'Yearly',
    nextDueDate: '2024-03-15',
    category: 'Insurance',
    suggestedSIPType: 'Liquid',
    currentSavings: 15000,
    isGrouped: false
  },
  {
    id: '2',
    name: 'Income Tax Payment',
    amount: 50000,
    frequency: 'Yearly',
    nextDueDate: '2024-07-31',
    category: 'Tax',
    suggestedSIPType: 'Arbitrage',
    currentSavings: 20000,
    isGrouped: false
  },
  {
    id: '3',
    name: 'Home Loan EMI',
    amount: 35000,
    frequency: 'Monthly',
    nextDueDate: '2024-02-01',
    category: 'EMI',
    suggestedSIPType: 'Liquid',
    currentSavings: 35000,
    isGrouped: false
  }
];

export function RecurringGoals() {
  const [goals, setGoals] = useState<RecurringGoal[]>(mockRecurringGoals);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const handleAddGoal = (newGoal: Omit<RecurringGoal, 'id'>) => {
    const goal: RecurringGoal = {
      ...newGoal,
      id: Date.now().toString()
    };
    
    setGoals([goal, ...goals]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save recurring goal to Firestore:', goal);
    
    toast({
      title: "Recurring goal added",
      description: `${newGoal.name} has been set up`,
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Insurance': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Tax': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'EMI': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Investment': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category] || colors['Other'];
  };

  const getSIPTypeColor = (sipType: string) => {
    const colors: Record<string, string> = {
      'Liquid': 'bg-blue-500',
      'Arbitrage': 'bg-green-500',
      'Flexi Cap': 'bg-purple-500',
      'Gold': 'bg-yellow-500',
    };
    return colors[sipType] || 'bg-gray-500';
  };

  const urgentGoals = goals.filter(goal => getDaysUntilDue(goal.nextDueDate) <= 90);
  const totalUpcoming = goals.reduce((sum, goal) => sum + goal.amount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentSavings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recurring Goals</h2>
          <p className="text-muted-foreground">Auto-generated from recurring payments</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Upcoming</p>
                <p className="text-lg font-bold text-foreground">₹{totalUpcoming.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-lg font-bold text-foreground">₹{totalSaved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Goals Alert */}
      {urgentGoals.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  {urgentGoals.length} goal(s) due within 3 months
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Consider consolidating these into a group for better SIP planning
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto">
                Auto-Group
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Form */}
      {showAddForm && (
        <AddRecurringGoalForm 
          onSubmit={handleAddGoal}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const daysUntilDue = getDaysUntilDue(goal.nextDueDate);
          const progressPercentage = (goal.currentSavings / goal.amount) * 100;
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`metric-card border-border/50 ${daysUntilDue <= 30 ? 'border-orange-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-foreground text-lg">
                          {goal.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">₹{goal.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{goal.frequency}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Due:</span>
                        <span className={`font-medium ${daysUntilDue <= 30 ? 'text-orange-600' : 'text-foreground'}`}>
                          {new Date(goal.nextDueDate).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-muted-foreground">
                          ({daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Suggested SIP:</span>
                        <div className={`w-3 h-3 rounded-full ${getSIPTypeColor(goal.suggestedSIPType)}`} />
                        <span className="text-xs font-medium">{goal.suggestedSIPType}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          ₹{goal.currentSavings.toLocaleString()} / ₹{goal.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-blue"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {progressPercentage.toFixed(1)}% complete
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Recurring Goals</h3>
          <p className="text-muted-foreground mb-4">Add your first recurring goal</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Goal
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AddRecurringGoalForm({ onSubmit, onCancel }: {
  onSubmit: (goal: Omit<RecurringGoal, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly' as RecurringGoal['frequency'],
    nextDueDate: '',
    category: 'Other' as RecurringGoal['category'],
    suggestedSIPType: 'Liquid' as RecurringGoal['suggestedSIPType'],
    currentSavings: '',
    isGrouped: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.nextDueDate) {
      return;
    }

    onSubmit({
      name: formData.name,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      nextDueDate: formData.nextDueDate,
      category: formData.category,
      suggestedSIPType: formData.suggestedSIPType,
      currentSavings: parseFloat(formData.currentSavings) || 0,
      isGrouped: formData.isGrouped
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add Recurring Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Car Insurance Premium"
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="25000"
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringGoal['frequency'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Next Due Date *
                </label>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RecurringGoal['category'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="Insurance">Insurance</option>
                  <option value="Tax">Tax</option>
                  <option value="EMI">EMI</option>
                  <option value="Investment">Investment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Suggested SIP Type
                </label>
                <select
                  value={formData.suggestedSIPType}
                  onChange={(e) => setFormData({ ...formData, suggestedSIPType: e.target.value as RecurringGoal['suggestedSIPType'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="Liquid">Liquid Fund</option>
                  <option value="Arbitrage">Arbitrage Fund</option>
                  <option value="Flexi Cap">Flexi Cap Fund</option>
                  <option value="Gold">Gold Fund</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Savings (₹)
                </label>
                <input
                  type="number"
                  value={formData.currentSavings}
                  onChange={(e) => setFormData({ ...formData, currentSavings: e.target.value })}
                  placeholder="0"
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Goal
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
