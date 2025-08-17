import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { extendedDb } from '@/lib/db-schema-extended';
import type { Subscription } from '@/lib/db-schema-extended';

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    cycle: 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly',
    startDate: new Date().toISOString().split('T')[0],
    reminderDays: '3'
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const allSubscriptions = await extendedDb.subscriptions.where('isActive').equals(1).toArray();
      setSubscriptions(allSubscriptions);
    } catch (error) {
      toast.error('Failed to load subscriptions');
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextDue = (startDate: Date, cycle: string): Date => {
    const nextDue = new Date(startDate);
    switch (cycle) {
      case 'Monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'Quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'Yearly':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }
    return nextDue;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDate = new Date(formData.startDate);
      const nextDue = calculateNextDue(startDate, formData.cycle);
      
      const subscriptionData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        cycle: formData.cycle,
        startDate,
        nextDue,
        reminderDays: parseInt(formData.reminderDays),
        isActive: true
      };

      if (editingSubscription) {
        await extendedDb.subscriptions.update(editingSubscription.id, subscriptionData);
        toast.success('Subscription updated successfully');
      } else {
        const id = crypto.randomUUID();
        await extendedDb.subscriptions.add({
          ...subscriptionData,
          id
        });
        toast.success('Subscription added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingSubscription(null);
      loadSubscriptions();
    } catch (error) {
      toast.error('Failed to save subscription');
      console.error('Error saving subscription:', error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.name,
      amount: subscription.amount.toString(),
      cycle: subscription.cycle,
      startDate: subscription.startDate.toISOString().split('T')[0],
      reminderDays: subscription.reminderDays.toString()
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      try {
        await extendedDb.subscriptions.update(id, { isActive: false });
        toast.success('Subscription deleted successfully');
        loadSubscriptions();
      } catch (error) {
        toast.error('Failed to delete subscription');
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      cycle: 'Monthly',
      startDate: new Date().toISOString().split('T')[0],
      reminderDays: '3'
    });
  };

  const getTotalMonthlyAmount = () => {
    return subscriptions.reduce((total, sub) => {
      switch (sub.cycle) {
        case 'Monthly':
          return total + sub.amount;
        case 'Quarterly':
          return total + (sub.amount / 3);
        case 'Yearly':
          return total + (sub.amount / 12);
        default:
          return total;
      }
    }, 0);
  };

  const getUpcomingSubscriptions = () => {
    const today = new Date();
    const upcoming = new Date(today);
    upcoming.setDate(today.getDate() + 7); // Next 7 days
    
    return subscriptions.filter(sub => sub.nextDue <= upcoming);
  };

  const upcomingSubscriptions = getUpcomingSubscriptions();

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading subscriptions...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subscription Manager</h1>
          <p className="text-muted-foreground">Track and manage your recurring subscriptions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Upcoming Renewals Alert */}
      {upcomingSubscriptions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-4 h-4" />
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {upcomingSubscriptions.length} subscription(s) due for renewal in the next 7 days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalMonthlyAmount())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingSubscriptions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <div className="grid gap-4">
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions recorded yet. Add your first subscription to get started!</p>
            </CardContent>
          </Card>
        ) : (
          subscriptions.map((subscription) => {
            const isUpcoming = upcomingSubscriptions.some(s => s.id === subscription.id);
            return (
              <Card key={subscription.id} className={isUpcoming ? 'border-orange-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{subscription.name}</h3>
                        <Badge variant="outline">{subscription.cycle}</Badge>
                        {isUpcoming && (
                          <Badge variant="destructive">Due Soon</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-medium">{formatCurrency(subscription.amount)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Due:</span>
                          <p className="font-medium">{subscription.nextDue.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Started:</span>
                          <p className="font-medium">{subscription.startDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reminder:</span>
                          <p className="font-medium">{subscription.reminderDays} days before</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(subscription)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(subscription.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <DialogTitle>{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Subscription Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Netflix, Spotify, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cycle">Billing Cycle</Label>
                <Select value={formData.cycle} onValueChange={(value: any) => setFormData({...formData, cycle: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="reminderDays">Reminder (days before)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({...formData, reminderDays: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingSubscription(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubscription ? 'Update' : 'Add'} Subscription
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
