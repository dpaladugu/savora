
/**
 * src/components/insurance/insurance-tracker.tsx
 *
 * InsuranceTracker is a React component that displays and manages a list of insurance policies
 * for a given user. It allows users to view, add, edit, and delete their insurance policies.
 *
 * The component fetches insurance policies from the database using the InsuranceService,
 * and provides a user interface for managing these policies.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { InsuranceService } from '@/services/InsuranceService';
import type { DexieInsurancePolicyRecord as AppInsurance } from '@/db';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface InsuranceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (policyData: Omit<AppInsurance, 'id'>) => void;
  initialValues?: Omit<AppInsurance, 'id'>;
  title: string;
}

const InsuranceForm: React.FC<InsuranceFormProps> = ({ open, onClose, onSubmit, initialValues, title }) => {
  const [policyName, setPolicyName] = useState(initialValues?.policyName || '');
  const [policyNumber, setPolicyNumber] = useState(initialValues?.policyNumber || '');
  const [insurer, setInsurer] = useState(initialValues?.insurer || '');
  const [type, setType] = useState(initialValues?.type || '');
  const [premium, setPremium] = useState(initialValues?.premium?.toString() || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency || '');
  const [startDate, setStartDate] = useState(initialValues?.startDate || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [status, setStatus] = useState(initialValues?.status || 'Active');
  const [coverageAmount, setCoverageAmount] = useState(initialValues?.coverageAmount?.toString() || '');
  const [nextDueDate, setNextDueDate] = useState(initialValues?.nextDueDate || '');
  const [note, setNote] = useState(initialValues?.note || '');

  useEffect(() => {
    if (initialValues) {
      setPolicyName(initialValues.policyName || '');
      setPolicyNumber(initialValues.policyNumber || '');
      setInsurer(initialValues.insurer || '');
      setType(initialValues.type || '');
      setPremium(initialValues.premium?.toString() || '');
      setFrequency(initialValues.frequency || '');
      setStartDate(initialValues.startDate || '');
      setEndDate(initialValues.endDate || '');
      setStatus(initialValues.status || 'Active');
      setCoverageAmount(initialValues.coverageAmount?.toString() || '');
      setNextDueDate(initialValues.nextDueDate || '');
      setNote(initialValues.note || '');
    }
  }, [initialValues]);

  const handleSubmit = () => {
    if (!policyName || !insurer || !type || !premium || !frequency || !status) {
      alert('Please fill in all required fields.');
      return;
    }

    const policyData: Omit<AppInsurance, 'id'> = {
      user_id: initialValues?.user_id || '',
      policyName,
      policyNumber,
      insurer,
      type,
      premium: parseFloat(premium),
      frequency,
      startDate,
      endDate,
      coverageAmount: coverageAmount ? parseFloat(coverageAmount) : undefined,
      nextDueDate,
      status,
      note,
      created_at: new Date(),
      updated_at: new Date(),
    };
    onSubmit(policyData);
    onClose();
  };

  const resetForm = () => {
    setPolicyName('');
    setPolicyNumber('');
    setInsurer('');
    setType('');
    setPremium('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setStatus('Active');
    setCoverageAmount('');
    setNextDueDate('');
    setNote('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="policyName">Policy Name *</Label>
            <Input
              id="policyName"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="insurer">Insurance Company *</Label>
            <Input
              id="insurer"
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Policy Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Life">Life Insurance</SelectItem>
                <SelectItem value="Health">Health Insurance</SelectItem>
                <SelectItem value="Auto">Auto Insurance</SelectItem>
                <SelectItem value="Home">Home Insurance</SelectItem>
                <SelectItem value="Travel">Travel Insurance</SelectItem>
                <SelectItem value="Term">Term Insurance</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input
              id="policyNumber"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="premium">Premium Amount *</Label>
            <Input
              id="premium"
              type="number"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="frequency">Premium Frequency *</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Half-yearly">Half-yearly</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coverageAmount">Coverage Amount</Label>
            <Input
              id="coverageAmount"
              type="number"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nextDueDate">Next Due Date</Label>
            <Input
              id="nextDueDate"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Notes</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InsuranceTracker: React.FC = () => {
  const [policies, setPolicies] = useState<AppInsurance[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AppInsurance | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const userId = user?.uid || '';

  const fetchPolicies = useCallback(async () => {
    if (userId) {
      try {
        const fetchedPolicies = await InsuranceService.getPolicies(userId);
        setPolicies(fetchedPolicies);
      } catch (error) {
        console.error('Failed to fetch policies:', error);
        toast({
          title: "Error",
          description: "Failed to fetch policies.",
          variant: "destructive",
        });
      }
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleAddDialogOpen = () => {
    setAddDialogOpen(true);
  };

  const handleEditDialogOpen = (policy: AppInsurance) => {
    setSelectedPolicy(policy);
    setEditDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedPolicy(null);
  };

  const handleAddPolicy = async (policyData: Omit<AppInsurance, 'id'>) => {
    try {
      await InsuranceService.addPolicy({ ...policyData, user_id: userId });
      toast({
        title: "Success",
        description: "Policy added successfully!",
      });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to add policy:', error);
      toast({
        title: "Error",
        description: "Failed to add policy.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePolicy = async (id: string, updates: Partial<AppInsurance>) => {
    try {
      await InsuranceService.updatePolicy(id, updates);
      toast({
        title: "Success",
        description: "Policy updated successfully!",
      });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast({
        title: "Error",
        description: "Failed to update policy.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await InsuranceService.deletePolicy(id);
      toast({
        title: "Success",
        description: "Policy deleted successfully!",
      });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to delete policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete policy.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Insurance Policies</h2>
        <Button onClick={handleAddDialogOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <InsuranceForm
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        onSubmit={handleAddPolicy}
        title="Add Insurance Policy"
        initialValues={{
          user_id: userId,
          policyName: '',
          policyNumber: '',
          insurer: '',
          type: '',
          premium: 0,
          frequency: '',
          startDate: '',
          endDate: '',
          coverageAmount: 0,
          nextDueDate: '',
          status: 'Active',
          note: '',
          created_at: new Date(),
          updated_at: new Date(),
        }}
      />

      <InsuranceForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSubmit={(updates) => {
          if (selectedPolicy) {
            handleUpdatePolicy(selectedPolicy.id, updates);
          }
        }}
        title="Edit Insurance Policy"
        initialValues={selectedPolicy || {
          user_id: userId,
          policyName: '',
          policyNumber: '',
          insurer: '',
          type: '',
          premium: 0,
          frequency: '',
          startDate: '',
          endDate: '',
          coverageAmount: 0,
          nextDueDate: '',
          status: 'Active',
          note: '',
          created_at: new Date(),
          updated_at: new Date(),
        }}
      />

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {policy.policyName}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditDialogOpen(policy)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeletePolicy(policy.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-medium">Insurance Company:</span> {policy.insurer}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {policy.type}
                </div>
                {policy.policyNumber && (
                  <div>
                    <span className="font-medium">Policy Number:</span> {policy.policyNumber}
                  </div>
                )}
                <div>
                  <span className="font-medium">Premium:</span> ${policy.premium} ({policy.frequency})
                </div>
                {policy.coverageAmount && (
                  <div>
                    <span className="font-medium">Coverage Amount:</span> ${policy.coverageAmount}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    policy.status === 'Active' ? 'bg-green-100 text-green-800' :
                    policy.status === 'Expired' ? 'bg-red-100 text-red-800' :
                    policy.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {policy.status}
                  </span>
                </div>
                {policy.startDate && (
                  <div>
                    <span className="font-medium">Start Date:</span> {policy.startDate}
                  </div>
                )}
                {policy.endDate && (
                  <div>
                    <span className="font-medium">End Date:</span> {policy.endDate}
                  </div>
                )}
                {policy.nextDueDate && (
                  <div>
                    <span className="font-medium">Next Due Date:</span> {policy.nextDueDate}
                  </div>
                )}
                {policy.note && (
                  <div>
                    <span className="font-medium">Notes:</span> {policy.note}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No insurance policies found. Add your first policy to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InsuranceTracker;
