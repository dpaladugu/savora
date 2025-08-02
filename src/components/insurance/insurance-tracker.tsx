
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Shield, Trash2, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Insurance } from '@/db';

interface InsuranceFormData {
  type: 'Term' | 'Health' | 'Motor' | 'Home' | 'Travel' | 'Personal-Accident';
  provider: string;
  policyNo: string;
  sumInsured: number;
  premium: number;
  dueDay: number;
  startDate: Date;
  endDate: Date;
  nomineeName: string;
  nomineeDOB: string;
  nomineeRelation: string;
  familyMember: string;
  notes: string;
}

const initialFormData: InsuranceFormData = {
  type: 'Health',
  provider: '',
  policyNo: '',
  sumInsured: 0,
  premium: 0,
  dueDay: 1,
  startDate: new Date(),
  endDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
  nomineeName: '',
  nomineeDOB: '',
  nomineeRelation: '',
  familyMember: 'Me',
  notes: '',
};

export function InsuranceTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsuranceFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const policies = useLiveQuery(() => db.insurance.orderBy('provider').toArray(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const policyData: Omit<Insurance, 'id'> = {
        ...formData,
      };

      if (editingId) {
        await db.insurance.update(editingId, policyData);
        toast.success('Insurance policy updated successfully');
      } else {
        const newId = self.crypto.randomUUID();
        await db.insurance.add({
          ...policyData,
          id: newId,
        });
        toast.success('Insurance policy added successfully');
      }

      setFormData(initialFormData);
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving insurance policy:', error);
      toast.error('Failed to save insurance policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (policy: Insurance) => {
    setFormData({
      type: policy.type,
      provider: policy.provider,
      policyNo: policy.policyNo,
      sumInsured: policy.sumInsured,
      premium: policy.premium,
      dueDay: policy.dueDay,
      startDate: policy.startDate,
      endDate: policy.endDate,
      nomineeName: policy.nomineeName,
      nomineeDOB: policy.nomineeDOB,
      nomineeRelation: policy.nomineeRelation,
      familyMember: policy.familyMember,
      notes: policy.notes || '',
    });
    setEditingId(policy.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.insurance.delete(id);
      toast.success('Insurance policy deleted successfully');
    } catch (error) {
      console.error('Error deleting insurance policy:', error);
      toast.error('Failed to delete insurance policy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Insurance Policies</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Policy' : 'Add New Policy'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Policy Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: InsuranceFormData['type']) => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term">Term Life</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Motor">Motor</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Personal-Accident">Personal Accident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {editingId ? 'Update Policy' : 'Add Policy'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {policies?.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{policy.provider}</h3>
                    <p className="text-sm text-muted-foreground">
                      {policy.policyNo} • {policy.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    ₹{policy.sumInsured.toLocaleString()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(policy)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(policy.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!policies?.length && (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Insurance Policies</h3>
              <p className="text-muted-foreground">
                Add your first insurance policy to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
