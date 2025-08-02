
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { Income } from '@/db';

interface IncomeSourceData {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  start_date: string;
  end_date: string | null;
  category: string;
  notes: string;
}

export function IncomeSourceManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadIncomeSources();
  }, []);

  const loadIncomeSources = async () => {
    try {
      setLoading(true);
      const incomes = await db.incomes.toArray();
      
      // Transform Income records to IncomeSourceData format
      const sourcesData: IncomeSourceData[] = incomes.map(income => ({
        id: income.id,
        name: income.description || 'Income Source', // Use description as name
        amount: income.amount,
        frequency: 'monthly' as const, // Default since frequency doesn't exist in Income
        start_date: typeof income.date === 'string' ? income.date : income.date.toISOString().split('T')[0],
        end_date: null,
        category: income.category,
        notes: income.description || ''
      }));
      
      setIncomeSources(sourcesData);
    } catch (error) {
      console.error('Error loading income sources:', error);
      toast.error('Failed to load income sources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncomeSource = async (formData: FormData) => {
    try {
      const incomeData: Omit<Income, 'id'> = {
        amount: parseFloat(formData.get('amount') as string),
        date: formData.get('start_date') as string,
        category: formData.get('category') as string,
        description: formData.get('name') as string,
      };

      await db.incomes.add({
        id: self.crypto.randomUUID(),
        ...incomeData
      });
      await loadIncomeSources();
      setShowAddDialog(false);
      toast.success('Income source added successfully');
    } catch (error) {
      console.error('Error adding income source:', error);
      toast.error('Failed to add income source');
    }
  };

  const handleDeleteIncomeSource = async (id: string) => {
    try {
      await db.incomes.delete(id);
      await loadIncomeSources();
      toast.success('Income source deleted successfully');
    } catch (error) {
      console.error('Error deleting income source:', error);
      toast.error('Failed to delete income source');
    }
  };

  if (loading) {
    return <div>Loading income sources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Income Sources</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Income Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Income Source</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddIncomeSource(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">Source Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <Button type="submit">Add Income Source</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {incomeSources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                {source.name}
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteIncomeSource(source.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold">₹{source.amount.toLocaleString()}</span>
                <Badge variant="secondary">{source.frequency}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Category: {source.category}</p>
                <p>Start Date: {new Date(source.start_date).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {incomeSources.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Income Sources</h3>
            <p className="text-muted-foreground mb-4">
              Add your first income source to start tracking your earnings.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Income Source
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
