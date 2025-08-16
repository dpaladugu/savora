import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { AutoGoalService } from '@/services/AutoGoalService';
import { formatCurrency } from '@/lib/format-utils';
import type { AutoGoal } from '@/db';

interface FundingRecommendation {
  goalId: string;
  goalName: string;
  amount: number;
  priority: 'High' | 'Medium' | 'Low';
}

export function EnhancedAutoGoalDashboard() {
  const [goals, setGoals] = useState<AutoGoal[]>([]);
  const [fundingRecs, setFundingRecs] = useState<FundingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    type: 'Medium' as 'Micro' | 'Small' | 'Short' | 'Medium' | 'Long',
    notes: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const allGoals = await AutoGoalService.getAutoGoals();
      setGoals(allGoals);
      generateFundingRecommendations();
    } catch (error) {
      toast.error('Failed to load goals');
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const goalData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: new Date(formData.targetDate),
        type: formData.type,
        currentAmount: 0,
        notes: formData.notes
      };

      await AutoGoalService.addAutoGoal(goalData);
      toast.success('Goal added successfully');

      resetForm();
      setShowAddModal(false);
      loadGoals();
    } catch (error) {
      toast.error('Failed to save goal');
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await AutoGoalService.deleteAutoGoal(id);
        toast.success('Goal deleted successfully');
        loadGoals();
      } catch (error) {
        toast.error('Failed to delete goal');
        console.error('Error deleting goal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      type: 'Medium',
      notes: ''
    });
  };

  const generateFundingRecommendations = () => {
    const recommendations: FundingRecommendation[] = goals
      .filter(goal => goal.currentAmount < goal.targetAmount)
      .map(goal => ({
        goalId: goal.id,
        goalName: goal.name,
        amount: Math.min(5000, goal.targetAmount - goal.currentAmount),
        priority: goal.targetDate < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) ? 'High' : 'Medium'
      }))
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);

    setFundingRecs(recommendations);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading goals...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Smart Goal Management</h1>
          <p className="text-muted-foreground">AI-powered goal recommendations and auto-funding strategies</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {/* Funding Recommendations */}
      {fundingRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Funding Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-none pl-0">
              {fundingRecs.map(rec => (
                <li key={rec.goalId} className="py-2 border-b last:border-none">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{rec.goalName}</p>
                      <p className="text-sm text-muted-foreground">
                        Fund {formatCurrency(rec.amount)} - Priority: {rec.priority}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Fund Now</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid gap-4">
        {goals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No goals recorded yet. Add your first goal to get started!</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Target: {formatCurrency(goal.targetAmount)} by {goal.targetDate.toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Current: {formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Goal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., New Car, Vacation"
                required
              />
            </div>

            <div>
              <Label htmlFor="targetAmount">Target Amount (₹)</Label>
              <Input
                id="targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="e.g., 50000"
                required
              />
            </div>

            <div>
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Goal Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Micro">Micro</SelectItem>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Short">Short</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the goal"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                Add Goal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
