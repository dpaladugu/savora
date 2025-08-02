
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/db';

interface IncomeSourceData {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  start_date: string;
  end_date?: string;
  category: string;
  notes: string;
  user_id: string;
}

export function IncomeSourceManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSourceData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<IncomeSourceData | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadIncomeSources();
  }, []);

  const loadIncomeSources = async () => {
    try {
      // Since incomes table doesn't exist in the current schema, we'll return empty array
      console.warn('Incomes table not available in current schema');
      setIncomeSources([]);
    } catch (error) {
      console.error('Error loading income sources:', error);
      toast.error('Failed to load income sources');
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEditClick = (source: IncomeSourceData) => {
    setIsEditing(true);
    setSelectedSource(source);
    setName(source.name);
    setAmount(source.amount);
    setFrequency(source.frequency);
    setCategory(source.category);
    setNotes(source.notes);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setSelectedSource(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount(0);
    setFrequency('monthly');
    setCategory('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.warn('Income source functionality not yet implemented - incomes table not available in current schema');
    toast.error('Income source functionality is not yet available');
    handleCancel();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this income source?')) {
      return;
    }

    console.warn('Income source delete functionality not yet implemented - incomes table not available in current schema');
    toast.error('Income source functionality is not yet available');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold flex items-center">
          <DollarSign className="mr-2 h-6 w-6" />
          Income Sources
        </CardTitle>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Income Source
        </Button>
      </CardHeader>
      <CardContent>
        {incomeSources.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No income sources found</p>
            <p className="text-sm text-gray-400 mt-2">Income source functionality is not yet available</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {incomeSources.map((source) => (
              <Card key={source.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">{source.name}</CardTitle>
                  <div className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(source)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(source.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Amount</Label>
                      <p className="text-sm">₹{source.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Frequency</Label>
                      <p className="text-sm capitalize">{source.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm">{source.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Start Date</Label>
                      <p className="text-sm">{source.start_date}</p>
                    </div>
                  </div>
                  {source.notes && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm">{source.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <Card className="max-w-md w-full p-4">
              <CardHeader>
                <CardTitle>{isAdding ? 'Add Income Source' : 'Edit Income Source'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={(value) => setFrequency(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit">{isAdding ? 'Add' : 'Update'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
