
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Calculator, Calendar } from 'lucide-react';
import { LoanService } from '@/services/LoanService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Loan } from '@/lib/db-extended';

export function LoanManager() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Personal' as 'Personal' | 'Home' | 'Car' | 'Education' | 'Business' | 'Gold' | 'Other',
    lender: '',
    principalAmount: '',
    interestRate: '',
    tenureMonths: '',
    emiAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const allLoans = await LoanService.getAllLoans();
      setLoans(allLoans);
    } catch (error) {
      toast.error('Failed to load loans');
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loanData = {
        type: formData.type,
        lender: formData.lender,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: parseInt(formData.tenureMonths),
        emiAmount: parseFloat(formData.emiAmount),
        startDate: new Date(formData.startDate),
        description: formData.description,
        isActive: true,
        paidAmount: 0,
        remainingAmount: parseFloat(formData.principalAmount)
      };

      if (editingLoan) {
        await LoanService.updateLoan(editingLoan.id, loanData);
        toast.success('Loan updated successfully');
      } else {
        await LoanService.addLoan(loanData);
        toast.success('Loan added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingLoan(null);
      loadLoans();
    } catch (error) {
      toast.error('Failed to save loan');
      console.error('Error saving loan:', error);
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      type: loan.type,
      lender: loan.lender,
      principalAmount: loan.principalAmount.toString(),
      interestRate: loan.interestRate.toString(),
      tenureMonths: loan.tenureMonths.toString(),
      emiAmount: loan.emiAmount.toString(),
      startDate: loan.startDate.toISOString().split('T')[0],
      description: loan.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      try {
        await LoanService.deleteLoan(id);
        toast.success('Loan deleted successfully');
        loadLoans();
      } catch (error) {
        toast.error('Failed to delete loan');
        console.error('Error deleting loan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Personal',
      lender: '',
      principalAmount: '',
      interestRate: '',
      tenureMonths: '',
      emiAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const calculateProgress = (loan: Loan) => {
    const totalPayable = loan.emiAmount * loan.tenureMonths;
    const progress = (loan.paidAmount / totalPayable) * 100;
    return Math.min(progress, 100);
  };

  const totalOutstanding = loans.filter(l => l.isActive).reduce((sum, loan) => sum + loan.remainingAmount, 0);
  const totalEMI = loans.filter(l => l.isActive).reduce((sum, loan) => sum + loan.emiAmount, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading loans...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Loan Manager</h1>
          <p className="text-muted-foreground">Track and manage your loans and EMIs</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEMI)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <div className="grid gap-4">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No loans recorded yet. Add your first loan to get started!</p>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const progress = calculateProgress(loan);
            const monthsElapsed = Math.floor((Date.now() - loan.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const remainingMonths = Math.max(0, loan.tenureMonths - monthsElapsed);

            return (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{loan.type} Loan</h3>
                        <Badge variant={loan.isActive ? "default" : "secondary"}>
                          {loan.isActive ? "Active" : "Closed"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{loan.lender}</p>
                      {loan.description && (
                        <p className="text-sm text-muted-foreground mb-2">{loan.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(loan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(loan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Principal:</span>
                      <p className="font-medium">{formatCurrency(loan.principalAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <p className="font-medium">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">EMI:</span>
                      <p className="font-medium">{formatCurrency(loan.emiAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining:</span>
                      <p className="font-medium text-red-600">{formatCurrency(loan.remainingAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}% completed</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{remainingMonths} months remaining</span>
                      <span>Started: {loan.startDate.toLocaleDateString()}</span>
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
            <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type">Loan Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lender">Lender</Label>
              <Input
                id="lender"
                value={formData.lender}
                onChange={(e) => setFormData({...formData, lender: e.target.value})}
                placeholder="Bank or lender name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="principalAmount">Principal Amount (₹)</Label>
                <Input
                  id="principalAmount"
                  type="number"
                  step="0.01"
                  value={formData.principalAmount}
                  onChange={(e) => setFormData({...formData, principalAmount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tenureMonths">Tenure (Months)</Label>
                <Input
                  id="tenureMonths"
                  type="number"
                  value={formData.tenureMonths}
                  onChange={(e) => setFormData({...formData, tenureMonths: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emiAmount">EMI Amount (₹)</Label>
                <Input
                  id="emiAmount"
                  type="number"
                  step="0.01"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({...formData, emiAmount: e.target.value})}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional notes about the loan"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingLoan(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLoan ? 'Update' : 'Add'} Loan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
