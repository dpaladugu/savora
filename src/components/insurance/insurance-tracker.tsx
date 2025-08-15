
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
import type { Insurance } from '@/lib/db';

export function InsuranceTracker() {
  const [policies, setPolicies] = useState<Insurance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Health' as 'Health' | 'Life' | 'Term' | 'Vehicle' | 'Home' | 'Travel',
    company: '',
    policyNumber: '',
    coverageAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const allPolicies = await InsuranceService.getAllInsurance();
      setPolicies(allPolicies);
    } catch (error) {
      toast.error('Failed to load insurance policies');
      console.error('Error loading insurance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const policyData = {
        type: formData.type,
        company: formData.company,
        policyNumber: formData.policyNumber,
        coverageAmount: parseFloat(formData.coverageAmount),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        description: formData.description
      };

      if (editingPolicy) {
        await InsuranceService.updateInsurance(editingPolicy.id, policyData);
        toast.success('Insurance policy updated successfully');
      } else {
        await InsuranceService.addInsurance(policyData);
        toast.success('Insurance policy added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (error) {
      toast.error('Failed to save insurance policy');
      console.error('Error saving insurance:', error);
    }
  };

  const handleEdit = (policy: Insurance) => {
    setEditingPolicy(policy);
    setFormData({
      type: policy.type,
      company: policy.company,
      policyNumber: policy.policyNumber,
      coverageAmount: policy.coverageAmount.toString(),
      startDate: policy.startDate.toISOString().split('T')[0],
      endDate: policy.endDate.toISOString().split('T')[0],
      description: policy.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this insurance policy?')) {
      try {
        await InsuranceService.deleteInsurance(id);
        toast.success('Insurance policy deleted successfully');
        loadPolicies();
      } catch (error) {
        toast.error('Failed to delete insurance policy');
        console.error('Error deleting insurance:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Health',
      company: '',
      policyNumber: '',
      coverageAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: ''
    });
  };

  const getExpiringPolicies = () => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    return policies.filter(policy => 
      new Date(policy.endDate) <= threeMonthsFromNow && 
      new Date(policy.endDate) > new Date()
    );
  };

  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverageAmount, 0);
  const expiringPolicies = getExpiringPolicies();

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

      {/* Expiring Policies Alert */}
      {expiringPolicies.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {expiringPolicies.length} policy(ies) expiring within 3 months. Please review and renew.
          </AlertDescription>
        </Alert>
      )}

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
          <p className="text-sm text-muted-foreground">{policies.length} active policies</p>
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
          policies.map((policy) => {
            const daysToExpiry = Math.ceil((new Date(policy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysToExpiry <= 90 && daysToExpiry > 0;
            const isExpired = daysToExpiry <= 0;

            return (
              <Card key={policy.id} className={isExpiringSoon ? 'border-yellow-200' : isExpired ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{policy.type} Insurance</h3>
                        <Badge variant="outline">{policy.company}</Badge>
                        {isExpiringSoon && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Expiring Soon</Badge>}
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Policy: {policy.policyNumber}</p>
                      {policy.description && (
                        <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                      )}
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
                      <span className="text-muted-foreground">Coverage:</span>
                      <p className="font-medium">{formatCurrency(policy.coverageAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium">{policy.startDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <p className={`font-medium ${isExpiringSoon ? 'text-yellow-600' : isExpired ? 'text-red-600' : ''}`}>
                        {policy.endDate.toLocaleDateString()}
                        {daysToExpiry > 0 && (
                          <span className="text-xs block">
                            {daysToExpiry} days remaining
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
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
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Life">Life</SelectItem>
                  <SelectItem value="Term">Term</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company">Insurance Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="Insurance company name"
                required
              />
            </div>

            <div>
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                placeholder="Policy number"
                required
              />
            </div>

            <div>
              <Label htmlFor="coverageAmount">Coverage Amount (₹)</Label>
              <Input
                id="coverageAmount"
                type="number"
                step="0.01"
                value={formData.coverageAmount}
                onChange={(e) => setFormData({...formData, coverageAmount: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional notes about the policy"
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
