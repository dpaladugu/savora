
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Download, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { SubscriptionService } from '@/services/SubscriptionService';

interface Subscription {
  id: string;
  name: string;
  cost: number;
  category: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  nextRenewal: Date;
  autoRenew: boolean;
  reminderEnabled: boolean;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const categories = [
  'Entertainment', 'Software', 'Utilities', 'Health', 'Education', 
  'Food', 'Transportation', 'Other'
];

export function SubscriptionTracker() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    category: 'Entertainment',
    billingCycle: 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly',
    nextRenewal: new Date().toISOString().split('T')[0],
    autoRenew: true,
    reminderEnabled: true,
    reminderDays: 7
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getActiveSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      toast.error('Failed to load subscriptions');
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subscriptionData = {
        name: formData.name,
        cost: parseFloat(formData.cost),
        category: formData.category,
        billingCycle: formData.billingCycle,
        nextRenewal: new Date(formData.nextRenewal),
        autoRenew: formData.autoRenew,
        reminderEnabled: formData.reminderEnabled,
        reminderDays: formData.reminderDays
      };

      if (editingSubscription) {
        await SubscriptionService.updateSubscription(editingSubscription.id, subscriptionData);
        toast.success('Subscription updated successfully');
      } else {
        await SubscriptionService.addSubscription(subscriptionData);
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
      cost: subscription.cost.toString(),
      category: subscription.category,
      billingCycle: subscription.billingCycle,
      nextRenewal: subscription.nextRenewal.toISOString().split('T')[0],
      autoRenew: subscription.autoRenew,
      reminderEnabled: subscription.reminderEnabled,
      reminderDays: subscription.reminderDays
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      try {
        await SubscriptionService.deleteSubscription(id);
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
      cost: '',
      category: 'Entertainment',
      billingCycle: 'Monthly',
      nextRenewal: new Date().toISOString().split('T')[0],
      autoRenew: true,
      reminderEnabled: true,
      reminderDays: 7
    });
  };

  const getTotalMonthlyCost = () => {
    return subscriptions.reduce((total, sub) => {
      switch (sub.billingCycle) {
        case 'Monthly':
          return total + sub.cost;
        case 'Quarterly':
          return total + (sub.cost / 3);
        case 'Yearly':
          return total + (sub.cost / 12);
        default:
          return total;
      }
    }, 0);
  };

  const getUpcomingRenewals = () => {
    const today = new Date();
    const upcoming = new Date(today);
    upcoming.setDate(today.getDate() + 7);
    
    return subscriptions.filter(sub => 
      sub.nextRenewal <= upcoming && sub.reminderEnabled
    );
  };

  const exportToCSV = () => {
    const csvData = subscriptions.map(sub => ({
      Name: sub.name,
      Cost: sub.cost,
      Category: sub.category,
      'Billing Cycle': sub.billingCycle,
      'Next Renewal': sub.nextRenewal.toLocaleDateString(),
      'Auto Renew': sub.autoRenew ? 'Yes' : 'No',
      'Reminder Enabled': sub.reminderEnabled ? 'Yes' : 'No'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriptions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const upcomingRenewals = getUpcomingRenewals();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage your recurring subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={subscriptions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Alert for upcoming renewals */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-800">
              <Bell className="w-4 h-4" />
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 text-sm">
              {upcomingRenewals.length} subscription(s) renewing in the next 7 days
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
            <div className="text-2xl font-bold">{formatCurrency(getTotalMonthlyCost())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingRenewals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found. Add your first subscription to get started!</p>
            </CardContent>
          </Card>
        ) : (
          subscriptions.map((subscription) => {
            const isUpcoming = upcomingRenewals.some(s => s.id === subscription.id);
            return (
              <Card key={subscription.id} className={`p-4 ${isUpcoming ? 'border-orange-200' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{subscription.name}</h3>
                      <Badge variant="outline">{subscription.category}</Badge>
                      <Badge variant="secondary">{subscription.billingCycle}</Badge>
                      {isUpcoming && <Badge variant="destructive">Due Soon</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <p className="font-medium">{formatCurrency(subscription.cost)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Renewal:</span>
                        <p className="font-medium">{subscription.nextRenewal.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Auto Renew:</span>
                        <p className="font-medium">{subscription.autoRenew ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reminders:</span>
                        <p className="font-medium">
                          {subscription.reminderEnabled ? `${subscription.reminderDays} days` : 'Off'}
                        </p>
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
              <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select value={formData.billingCycle} onValueChange={(value: any) => setFormData({...formData, billingCycle: value})}>
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
              <div>
                <Label htmlFor="nextRenewal">Next Renewal</Label>
                <Input
                  id="nextRenewal"
                  type="date"
                  value={formData.nextRenewal}
                  onChange={(e) => setFormData({...formData, nextRenewal: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="autoRenew">Auto Renew</Label>
                <p className="text-sm text-muted-foreground">Automatically renew subscription</p>
              </div>
              <Switch
                id="autoRenew"
                checked={formData.autoRenew}
                onCheckedChange={(checked) => setFormData({...formData, autoRenew: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="reminderEnabled">Renewal Reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified before renewal</p>
              </div>
              <Switch
                id="reminderEnabled"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) => setFormData({...formData, reminderEnabled: checked})}
              />
            </div>

            {formData.reminderEnabled && (
              <div>
                <Label htmlFor="reminderDays">Reminder Days Before</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({...formData, reminderDays: parseInt(e.target.value)})}
                />
              </div>
            )}

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
