
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/db';

// Define Insurance interface locally since it's not available in db
interface Insurance {
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
  personalTermCover?: number;
  personalHealthCover?: number;
  employerTermCover?: number;
  employerHealthCover?: number;
  notes: string;
}

export function InsuranceTracker() {
  const [policies, setPolicies] = useState<Insurance[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Insurance | null>(null);

  // Form state
  const [type, setType] = useState<Insurance['type']>('Term');
  const [provider, setProvider] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [sumInsured, setSumInsured] = useState(0);
  const [premium, setPremium] = useState(0);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      // Since insurance table doesn't exist, we'll return empty array
      // In a real implementation, this would fetch from db.insurance.toArray()
      console.warn('Insurance table not available in current schema');
      setPolicies([]);
    } catch (error) {
      console.error('Error loading insurance policies:', error);
      toast.error('Failed to load insurance policies');
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    resetForm();
  };

  const handleEditClick = (policy: Insurance) => {
    setIsEditing(true);
    setSelectedPolicy(policy);
    setType(policy.type);
    setProvider(policy.provider);
    setPolicyNo(policy.policyNo);
    setSumInsured(policy.sumInsured);
    setPremium(policy.premium);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setSelectedPolicy(null);
    resetForm();
  };

  const resetForm = () => {
    setType('Term');
    setProvider('');
    setPolicyNo('');
    setSumInsured(0);
    setPremium(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.warn('Insurance functionality not yet implemented - insurance table not available in current schema');
    toast.error('Insurance functionality is not yet available');
    handleCancel();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    console.warn('Insurance delete functionality not yet implemented - insurance table not available in current schema');
    toast.error('Insurance functionality is not yet available');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Shield className="mr-2 h-6 w-6" />
          Insurance Policies
        </CardTitle>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No insurance policies found</p>
            <p className="text-sm text-gray-400 mt-2">Insurance functionality is not yet available</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {policy.provider} - {policy.type}
                  </CardTitle>
                  <div className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(policy.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Policy Number</Label>
                      <p className="text-sm">{policy.policyNo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sum Insured</Label>
                      <p className="text-sm">₹{policy.sumInsured.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Premium</Label>
                      <p className="text-sm">₹{policy.premium.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <Badge variant="secondary">{policy.type}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <Card className="max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{isAdding ? 'Add Insurance Policy' : 'Edit Insurance Policy'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value) => setType(value as Insurance['type'])}>
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
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="policyNo">Policy Number</Label>
                    <Input
                      id="policyNo"
                      value={policyNo}
                      onChange={(e) => setPolicyNo(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sumInsured">Sum Insured</Label>
                    <Input
                      id="sumInsured"
                      type="number"
                      value={sumInsured}
                      onChange={(e) => setSumInsured(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="premium">Premium</Label>
                    <Input
                      id="premium"
                      type="number"
                      value={premium}
                      onChange={(e) => setPremium(Number(e.target.value))}
                      required
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
