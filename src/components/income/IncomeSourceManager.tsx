
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from "@/services/auth-service";
import { IncomeSourceService } from '@/services/IncomeSourceService';
import { useToast } from "@/hooks/use-toast";

// Define the interface to match the actual service response
interface IncomeSourceData {
  id?: string;
  name: string;
  source_type?: string;
  expected_amount?: number;
  frequency?: string;
  user_id?: string;
}

// Use local interface that matches what we display
interface IncomeSource {
  id?: string;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  user_id?: string;
}

export function IncomeSourceManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [frequency, setFrequency] = useState('monthly');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchIncomeSources = async () => {
      if (!user?.uid) return;
      try {
        const sources = await IncomeSourceService.getIncomeSources(user.uid);
        // Map the data from service response to our local interface
        const mappedSources = sources.map((source: IncomeSourceData) => ({
          id: source.id,
          name: source.name,
          type: source.source_type || 'salary',
          amount: source.expected_amount || 0,
          frequency: source.frequency || 'monthly',
          user_id: source.user_id
        }));
        setIncomeSources(mappedSources);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to fetch income sources: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    fetchIncomeSources();
  }, [user?.uid, toast]);

  const handleAddSource = async () => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Map our local interface to service expected format
      await IncomeSourceService.addIncomeSource({
        name: name.trim(),
        source_type: type,
        expected_amount: Number(amount),
        frequency,
        user_id: user.uid,
      });

      const sources = await IncomeSourceService.getIncomeSources(user.uid);
      const mappedSources = sources.map((source: IncomeSourceData) => ({
        id: source.id,
        name: source.name,
        type: source.source_type || 'salary',
        amount: source.expected_amount || 0,
        frequency: source.frequency || 'monthly',
        user_id: source.user_id
      }));
      setIncomeSources(mappedSources);
      handleCancel();
      toast({
        title: "Success",
        description: "Income source added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add income source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      await IncomeSourceService.deleteIncomeSource(id);
      const sources = await IncomeSourceService.getIncomeSources(user.uid);
      const mappedSources = sources.map((source: IncomeSourceData) => ({
        id: source.id,
        name: source.name,
        type: source.source_type || 'salary',
        amount: source.expected_amount || 0,
        frequency: source.frequency || 'monthly',
        user_id: source.user_id
      }));
      setIncomeSources(mappedSources);
      toast({
        title: "Success",
        description: "Income source deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete income source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSource = async () => {
    if (!user?.uid || !editingSource?.id) return;

    if (!name.trim() || !amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await IncomeSourceService.updateIncomeSource(editingSource.id, {
        name: name.trim(),
        source_type: type,
        expected_amount: Number(amount),
        frequency,
        user_id: user.uid,
      });

      const sources = await IncomeSourceService.getIncomeSources(user.uid);
      const mappedSources = sources.map((source: IncomeSourceData) => ({
        id: source.id,
        name: source.name,
        type: source.source_type || 'salary',
        amount: source.expected_amount || 0,
        frequency: source.frequency || 'monthly',
        user_id: source.user_id
      }));
      setIncomeSources(mappedSources);
      handleCancel();
      toast({
        title: "Success",
        description: "Income source updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update income source: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (source: IncomeSource) => {
    setEditingSource(source);
    setName(source.name);
    setType(source.type);
    setAmount(source.amount);
    setFrequency(source.frequency);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSource(null);
    setName('');
    setType('');
    setAmount('');
    setFrequency('monthly');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Income Sources</h2>
          <p className="text-muted-foreground">Manage your income sources</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Income Source
        </Button>
      </div>

      <div className="grid gap-4">
        {incomeSources.map((source) => (
          <Card key={source.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{source.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {source.type} • ₹{source.amount.toLocaleString()} {source.frequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(source)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => source.id && handleDeleteSource(source.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddForm && (
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSource ? 'Edit' : 'Add'} Income Source</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Salary, Freelance, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={editingSource ? handleUpdateSource : handleAddSource}>
                {editingSource ? 'Update' : 'Add'} Source
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
