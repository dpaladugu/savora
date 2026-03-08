
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Shield, Calendar, AlertTriangle } from 'lucide-react';
import { InsuranceService } from '@/services/InsuranceService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';

interface InsurancePolicy {
  id: string;
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

export function InsuranceTracker() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Health' as 'Term' | 'Health' | 'Motor' | 'Home' | 'Travel' | 'Personal-Accident',
    provider: '',
    policyNo: '',
    sumInsured: '',
    premium: '',
    dueDay: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nomineeName: '',
    nomineeDOB: '',
    nomineeRelation: '',
    familyMember: '',
    notes: ''
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const allPolicies = await InsuranceService.getPolicies();
      setPolicies(allPolicies as InsurancePolicy[]);
    } catch (error) {
      toast.error('Insurance service not yet implemented');
      console.error('Error loading insurance:', error);
      setPolicies([]); // Set empty array for now
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const policyData = {
        type: formData.type,
        provider: formData.provider,
        policyNo: formData.policyNo,
        sumInsured: parseFloat(formData.sumInsured),
        premium: parseFloat(formData.premium),
        dueDay: parseInt(formData.dueDay),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        nomineeName: formData.nomineeName,
        nomineeDOB: formData.nomineeDOB,
        nomineeRelation: formData.nomineeRelation,
        familyMember: formData.familyMember,
        notes: formData.notes
      };

      if (editingPolicy) {
        await InsuranceService.updatePolicy(editingPolicy.id, policyData);
        toast.success('Insurance policy updated successfully');
      } else {
        await InsuranceService.addPolicy(policyData);
        toast.success('Insurance policy added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (error) {
      toast.error('Insurance service not yet implemented');
      console.error('Error saving insurance:', error);
    }
  };

  const handleEdit = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      type: policy.type,
      provider: policy.provider,
      policyNo: policy.policyNo,
      sumInsured: policy.sumInsured.toString(),
      premium: policy.premium.toString(),
      dueDay: policy.dueDay.toString(),
      startDate: policy.startDate.toISOString().split('T')[0],
      endDate: policy.endDate.toISOString().split('T')[0],
      nomineeName: policy.nomineeName,
      nomineeDOB: policy.nomineeDOB,
      nomineeRelation: policy.nomineeRelation,
      familyMember: policy.familyMember,
      notes: policy.notes
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this insurance policy?')) {
      try {
        await InsuranceService.deletePolicy(id);
        toast.success('Insurance policy deleted successfully');
        loadPolicies();
      } catch (error) {
        toast.error('Insurance service not yet implemented');
        console.error('Error deleting insurance:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Health',
      provider: '',
      policyNo: '',
      sumInsured: '',
      premium: '',
      dueDay: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      nomineeName: '',
      nomineeDOB: '',
      nomineeRelation: '',
      familyMember: '',
      notes: ''
    });
  };

  const totalCoverage = policies.reduce((sum, policy) => sum + policy.sumInsured, 0);
  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading insurance policies...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Insurance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Policies, premiums & renewals</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="h-9 gap-1.5 rounded-xl text-xs shrink-0">
          <Plus className="h-3.5 w-3.5" /> Add Policy
        </Button>
      </div>

      <Alert className="border-warning/30 bg-warning/8">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-xs">
          Insurance service is in beta. UI preview only — data saved locally.
        </AlertDescription>
      </Alert>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Coverage</p>
            <p className="text-base font-bold text-foreground tabular-nums">{formatCurrency(totalCoverage)}</p>
            <p className="text-[10px] text-muted-foreground">{policies.length} policies</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Annual Premium</p>
            <p className="text-base font-bold value-negative tabular-nums">{formatCurrency(totalPremium)}</p>
            <p className="text-[10px] text-muted-foreground">per year</p>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Policies List */}
      <div className="space-y-3">
        {policies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No policies yet. Add your first.</p>
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-semibold text-foreground">{policy.type} Insurance</h3>
                      <Badge variant="outline" className="text-[10px]">{policy.provider}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{policy.policyNo} · {policy.familyMember}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => handleEdit(policy)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(policy.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">Sum Insured</p>
                    <p className="font-medium">{formatCurrency(policy.sumInsured)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">Premium</p>
                    <p className="font-medium value-negative">{formatCurrency(policy.premium)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Insurance Policy' : 'Add Insurance Policy'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Insurance Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term">Term</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Motor">Motor</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Personal-Accident">Personal Accident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="provider">Insurance Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                placeholder="LIC, HDFC ERGO, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="policyNo">Policy Number</Label>
              <Input
                id="policyNo"
                value={formData.policyNo}
                onChange={(e) => setFormData({...formData, policyNo: e.target.value})}
                placeholder="Policy number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sumInsured">Sum Insured (₹)</Label>
                <Input
                  id="sumInsured"
                  type="number"
                  value={formData.sumInsured}
                  onChange={(e) => setFormData({...formData, sumInsured: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="premium">Annual Premium (₹)</Label>
                <Input
                  id="premium"
                  type="number"
                  value={formData.premium}
                  onChange={(e) => setFormData({...formData, premium: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="familyMember">Family Member</Label>
              <Input
                id="familyMember"
                value={formData.familyMember}
                onChange={(e) => setFormData({...formData, familyMember: e.target.value})}
                placeholder="Self, Spouse, etc."
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingPolicy(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPolicy ? 'Update' : 'Add'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
