
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Insurance Tracker</h1>
          <p className="text-muted-foreground">Manage your insurance policies and track renewals</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Policy
        </Button>
      </div>

      {/* Notice about implementation status */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Insurance service is not yet fully implemented. This is a preview of the interface.
        </AlertDescription>
      </Alert>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Total Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCoverage)}</div>
          <p className="text-sm text-muted-foreground">
            {policies.length} policies • Annual premium: {formatCurrency(totalPremium)}
          </p>
        </CardContent>
      </Card>

      {/* Insurance Policies List */}
      <div className="grid gap-4">
        {policies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No insurance policies recorded yet. Add your first policy to get started!</p>
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{policy.type} Insurance</h3>
                      <Badge variant="outline">{policy.provider}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Policy: {policy.policyNo}</p>
                    <p className="text-sm text-muted-foreground mb-2">Family Member: {policy.familyMember}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(policy)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(policy.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sum Insured:</span>
                    <p className="font-medium">{formatCurrency(policy.sumInsured)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Premium:</span>
                    <p className="font-medium">{formatCurrency(policy.premium)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <p className="font-medium">{policy.endDate.toLocaleDateString()}</p>
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
