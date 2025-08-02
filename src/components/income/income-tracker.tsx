
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, TrendingUp, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, Income } from "@/db";
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/format-utils";

// Use the database Income interface directly
export type AppIncome = Income;

interface IncomeFormData {
  date: string;
  amount: number;
  category: string;
  description: string;
}

const initialFormData: IncomeFormData = {
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  category: 'Salary',
  description: '',
};

export function IncomeTracker() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState<IncomeFormData>(initialFormData);

  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray(), []);

  const handleInputChange = (field: keyof IncomeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.amount || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const incomeData: Omit<Income, 'id'> = {
        date: new Date(formData.date),
        amount: formData.amount,
        category: formData.category,
        description: formData.description,
      };

      if (editingIncome) {
        await db.incomes.update(editingIncome.id!, incomeData);
        toast({
          title: "Income Updated",
          description: "Income entry has been updated successfully.",
        });
      } else {
        await db.incomes.add({
          ...incomeData,
          id: crypto.randomUUID(),
        });
        toast({
          title: "Income Added",
          description: "New income entry has been added successfully.",
        });
      }

      setFormData(initialFormData);
      setShowForm(false);
      setEditingIncome(null);
    } catch (error) {
      console.error('Error saving income:', error);
      toast({
        title: "Error",
        description: "Failed to save income entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setFormData({
      date: income.date instanceof Date ? income.date.toISOString().split('T')[0] : income.date.toString().split('T')[0],
      amount: income.amount,
      category: income.category,
      description: income.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.incomes.delete(id);
      toast({
        title: "Income Deleted",
        description: "Income entry has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: "Failed to delete income entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Income</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Income Entries</p>
                <p className="text-2xl font-bold">{incomes?.length || 0}</p>
              </div>
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter income description"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingIncome ? 'Update Income' : 'Add Income'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIncome(null);
                    setFormData(initialFormData);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incomes?.map((income) => (
              <Card key={income.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{income.description || income.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(income.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{formatCurrency(income.amount)}
                      </p>
                      <Badge variant="outline">{income.category}</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(income.id!)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {!incomes?.length && (
              <p className="text-center text-muted-foreground py-8">
                No income entries found. Add your first income entry to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
