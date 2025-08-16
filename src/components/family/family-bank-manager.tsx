
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, ArrowUpRight, Building } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { extendedDb } from '@/lib/db-schema-extended';
import type { FamilyBankAccount, FamilyTransfer } from '@/lib/db-schema-extended';

export function FamilyBankManager() {
  const [accounts, setAccounts] = useState<FamilyBankAccount[]>([]);
  const [transfers, setTransfers] = useState<FamilyTransfer[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FamilyBankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountForm, setAccountForm] = useState({
    owner: 'Mother' as 'Mother' | 'Grandmother',
    bankName: '',
    accountNo: '',
    type: 'Savings' as 'Savings' | 'Current' | 'FD',
    currentBalance: ''
  });
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toPerson: 'Mother' as 'Mother' | 'Grandmother' | 'Brother',
    amount: '',
    purpose: '',
    mode: 'Bank' as 'Cash' | 'Bank' | 'UPI',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transfersData] = await Promise.all([
        extendedDb.familyBankAccounts.toArray(),
        extendedDb.familyTransfers.orderBy('date').reverse().limit(10).toArray()
      ]);
      setAccounts(accountsData);
      setTransfers(transfersData);
    } catch (error) {
      toast.error('Failed to load family banking data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountData = {
        owner: accountForm.owner,
        bankName: accountForm.bankName,
        accountNo: accountForm.accountNo,
        type: accountForm.type,
        currentBalance: parseFloat(accountForm.currentBalance)
      };

      if (editingAccount) {
        await extendedDb.familyBankAccounts.update(editingAccount.id, accountData);
        toast.success('Account updated successfully');
      } else {
        const id = crypto.randomUUID();
        await extendedDb.familyBankAccounts.add({
          ...accountData,
          id
        });
        toast.success('Account added successfully');
      }

      resetAccountForm();
      setShowAccountModal(false);
      setEditingAccount(null);
      loadData();
    } catch (error) {
      toast.error('Failed to save account');
      console.error('Error saving account:', error);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transferData = {
        fromAccountId: transferForm.fromAccountId,
        toPerson: transferForm.toPerson,
        amount: parseFloat(transferForm.amount),
        date: new Date(transferForm.date),
        purpose: transferForm.purpose,
        mode: transferForm.mode
      };

      const id = crypto.randomUUID();
      await extendedDb.familyTransfers.add({
        ...transferData,
        id
      });

      // Update account balance if from an existing account
      if (transferForm.fromAccountId && transferForm.fromAccountId !== 'cash') {
        const account = accounts.find(a => a.id === transferForm.fromAccountId);
        if (account) {
          await extendedDb.familyBankAccounts.update(account.id, {
            currentBalance: account.currentBalance - parseFloat(transferForm.amount)
          });
        }
      }

      toast.success('Transfer recorded successfully');
      resetTransferForm();
      setShowTransferModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to record transfer');
      console.error('Error recording transfer:', error);
    }
  };

  const handleEditAccount = (account: FamilyBankAccount) => {
    setEditingAccount(account);
    setAccountForm({
      owner: account.owner,
      bankName: account.bankName,
      accountNo: account.accountNo,
      type: account.type,
      currentBalance: account.currentBalance.toString()
    });
    setShowAccountModal(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        await extendedDb.familyBankAccounts.delete(id);
        toast.success('Account deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete account');
        console.error('Error deleting account:', error);
      }
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      owner: 'Mother',
      bankName: '',
      accountNo: '',
      type: 'Savings',
      currentBalance: ''
    });
  };

  const resetTransferForm = () => {
    setTransferForm({
      fromAccountId: '',
      toPerson: 'Mother',
      amount: '',
      purpose: '',
      mode: 'Bank',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.currentBalance, 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading family banking data...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Family Bank Manager</h1>
          <p className="text-muted-foreground">Manage family bank accounts and transfers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAccountModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
          <Button onClick={() => setShowTransferModal(true)} variant="outline" className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Record Transfer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="w-4 h-4" />
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalBalance())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Recent Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transfers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Family Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Family Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No family accounts recorded yet. Add the first account to get started!
            </p>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{account.bankName}</h4>
                          <Badge variant="outline">{account.owner}</Badge>
                          <Badge variant="secondary">{account.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Account No:</span>
                            <p className="font-medium">****{account.accountNo.slice(-4)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <p className="font-medium">{formatCurrency(account.currentBalance)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEditAccount(account)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteAccount(account.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transfers recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => {
                const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
                return (
                  <div key={transfer.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">To {transfer.toPerson}</span>
                        <Badge variant="outline">{transfer.mode}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: {fromAccount?.bankName || 'Cash'} • {transfer.purpose}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(transfer.amount)}</p>
                      <p className="text-xs text-muted-foreground">{transfer.date.toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Account Modal */}
      <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Family Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            <div>
              <Label htmlFor="owner">Account Owner</Label>
              <Select value={accountForm.owner} onValueChange={(value: any) => setAccountForm({...accountForm, owner: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Grandmother">Grandmother</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={accountForm.bankName}
                onChange={(e) => setAccountForm({...accountForm, bankName: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNo">Account Number</Label>
                <Input
                  id="accountNo"
                  value={accountForm.accountNo}
                  onChange={(e) => setAccountForm({...accountForm, accountNo: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Account Type</Label>
                <Select value={accountForm.type} onValueChange={(value: any) => setAccountForm({...accountForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="FD">Fixed Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="currentBalance">Current Balance (₹)</Label>
              <Input
                id="currentBalance"
                type="number"
                step="0.01"
                value={accountForm.currentBalance}
                onChange={(e) => setAccountForm({...accountForm, currentBalance: e.target.value})}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAccountModal(false);
                setEditingAccount(null);
                resetAccountForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAccount ? 'Update' : 'Add'} Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Family Transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fromAccountId">From Account</Label>
              <Select value={transferForm.fromAccountId} onValueChange={(value) => setTransferForm({...transferForm, fromAccountId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bankName} ({account.owner})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toPerson">To Person</Label>
                <Select value={transferForm.toPerson} onValueChange={(value: any) => setTransferForm({...transferForm, toPerson: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Grandmother">Grandmother</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mode">Transfer Mode</Label>
                <Select value={transferForm.mode} onValueChange={(value: any) => setTransferForm({...transferForm, mode: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({...transferForm, date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={transferForm.purpose}
                onChange={(e) => setTransferForm({...transferForm, purpose: e.target.value})}
                placeholder="Monthly support, medical expenses, etc."
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowTransferModal(false);
                resetTransferForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Record Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
