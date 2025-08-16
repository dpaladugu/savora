
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calculator, AlertTriangle } from 'lucide-react';
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
    type: 'Personal' as 'Personal' | 'Personal-Brother' | 'Education-Brother',
    borrower: 'Me' as 'Me' | 'Brother',
    principal: '',
    roi: '',
    tenureMonths: '',
    emi: '',
    outstanding: '',
    startDate: new Date().toISOString().split('T')[0]
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
        borrower: formData.borrower,
        principal: parseFloat(formData.principal),
        roi: parseFloat(formData.roi),
        tenureMonths: parseInt(formData.tenureMonths),
        emi: parseFloat(formData.emi),
        outstanding: parseFloat(formData.outstanding),
        startDate: new Date(formData.startDate),
        isActive: true
      };

      if (editingLoan) {
        await LoanService.updateLoan(editingLoan.id, loanData);
        toast.success('Loan updated successfully');
      } else {
        await LoanService.createLoan(loanData);
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
      borrower: loan.borrower,
      principal: loan.principal.toString(),
      roi: loan.roi.toString(),
      tenureMonths: loan.tenureMonths.toString(),
      emi: loan.emi.toString(),
      outstanding: loan.outstanding.toString(),
      startDate: loan.startDate.toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      try {
        await LoanService.updateLoan(id, { isActive: false });
        toast.success('Loan marked as inactive');
        loadLoans();
      } catch (error) {
        toast.error('Failed to update loan');
        console.error('Error updating loan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Personal',
      borrower: 'Me',
      principal: '',
      roi: '',
      tenureMonths: '',
      emi: '',
      outstanding: '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const totalOutstanding = loans.filter(loan => loan.isActive).reduce((sum, loan) => sum + loan.outstanding, 0);
  const totalEMI = loans.filter(loan => loan.isActive).reduce((sum, loan) => sum + loan.emi, 0);
  const highInterestLoans = loans.filter(loan => loan.isActive && loan.roi > 12);

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading loans...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Loan Manager</h1>
          <p className="text-muted-foreground">Track and manage your loans and repayments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Interest Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highInterestLoans.length}</div>
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
          loans.map((loan) => (
            <Card key={loan.id} className={!loan.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{loan.type} Loan</h3>
                      <Badge variant={loan.isActive ? "default" : "secondary"}>
                        {loan.isActive ? 'Active' : 'Closed'}
                      </Badge>
                      <Badge variant="outline">{loan.borrower}</Badge>
                      {loan.roi > 12 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High Interest
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Principal:</span>
                        <p className="font-medium">{formatCurrency(loan.principal)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <p className="font-medium">{loan.roi}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">EMI:</span>
                        <p className="font-medium">{formatCurrency(loan.emi)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Outstanding:</span>
                        <p className="font-medium">{formatCurrency(loan.outstanding)}</p>
                      </div>
                    </div>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
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
                  <SelectItem value="Personal-Brother">Personal-Brother</SelectItem>
                  <SelectItem value="Education-Brother">Education-Brother</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="borrower">Borrower</Label>
              <Select value={formData.borrower} onValueChange={(value: any) => setFormData({...formData, borrower: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Me">Me</SelectItem>
                  <SelectItem value="Brother">Brother</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="principal">Principal Amount (₹)</Label>
                <Input
                  id="principal"
                  type="number"
                  step="0.01"
                  value={formData.principal}
                  onChange={(e) => setFormData({...formData, principal: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="roi">Interest Rate (%)</Label>
                <Input
                  id="roi"
                  type="number"
                  step="0.01"
                  value={formData.roi}
                  onChange={(e) => setFormData({...formData, roi: e.target.value})}
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
                <Label htmlFor="emi">EMI Amount (₹)</Label>
                <Input
                  id="emi"
                  type="number"
                  step="0.01"
                  value={formData.emi}
                  onChange={(e) => setFormData({...formData, emi: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="outstanding">Outstanding Amount (₹)</Label>
              <Input
                id="outstanding"
                type="number"
                step="0.01"
                value={formData.outstanding}
                onChange={(e) => setFormData({...formData, outstanding: e.target.value})}
                required
              />
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
