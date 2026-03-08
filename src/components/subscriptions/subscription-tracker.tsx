
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
import { SubscriptionService, type Subscription } from '@/services/SubscriptionService';

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
      billingCycle: subscription.billingCycle as 'Monthly' | 'Quarterly' | 'Yearly',
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
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Recurring charges & renewals</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={subscriptions.length === 0} className="h-9 text-xs gap-1.5 rounded-xl">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="h-9 text-xs gap-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Upcoming alert */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
            <p className="text-xs text-warning font-medium">
              {upcomingRenewals.length} subscription{upcomingRenewals.length > 1 ? 's' : ''} renewing within 7 days
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary — 3 col */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Active',   value: subscriptions.length.toString(),          cls: 'text-foreground'  },
          { label: 'Monthly',  value: formatCurrency(getTotalMonthlyCost()),    cls: 'text-foreground'  },
          { label: 'Due Soon', value: upcomingRenewals.length.toString(),        cls: upcomingRenewals.length > 0 ? 'value-negative' : 'text-foreground' },
        ].map(({ label, value, cls }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className={`text-sm font-bold tabular-nums ${cls}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Repeat className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
            </CardContent>
          </Card>
        ) : subscriptions.map(sub => {
          const isUpcoming = upcomingRenewals.some(s => s.id === sub.id);
          return (
            <Card key={sub.id} className={`glass ${isUpcoming ? 'border-warning/40' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{sub.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{sub.category}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{sub.billingCycle}</Badge>
                    {isUpcoming && <Badge variant="destructive" className="text-[10px]">Due Soon</Badge>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(sub)} aria-label="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(sub.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Cost: </span><span className="font-medium">{formatCurrency(sub.cost)}</span></div>
                  <div><span className="text-muted-foreground">Renews: </span><span className="font-medium">{sub.nextRenewal.toLocaleDateString('en-IN')}</span></div>
                  <div><span className="text-muted-foreground">Auto-renew: </span><span className="font-medium">{sub.autoRenew ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-muted-foreground">Reminder: </span><span className="font-medium">{sub.reminderEnabled ? `${sub.reminderDays}d` : 'Off'}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">{editingSubscription ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="Netflix, Spotify…" className="h-9 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cost (₹)</Label>
                <Input type="number" step="0.01" value={formData.cost} onChange={e => setFormData(p => ({...p, cost: e.target.value}))} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(p => ({...p, category: v}))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Billing Cycle</Label>
                <Select value={formData.billingCycle} onValueChange={(v: any) => setFormData(p => ({...p, billingCycle: v}))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly" className="text-xs">Monthly</SelectItem>
                    <SelectItem value="Quarterly" className="text-xs">Quarterly</SelectItem>
                    <SelectItem value="Yearly" className="text-xs">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Next Renewal</Label>
                <Input type="date" value={formData.nextRenewal} onChange={e => setFormData(p => ({...p, nextRenewal: e.target.value}))} className="h-9 text-sm" required />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <div><p className="text-xs font-medium">Auto Renew</p><p className="text-[10px] text-muted-foreground">Auto-charge on renewal</p></div>
              <Switch checked={formData.autoRenew} onCheckedChange={v => setFormData(p => ({...p, autoRenew: v}))} aria-label="Toggle auto renew" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40">
              <div><p className="text-xs font-medium">Reminders</p><p className="text-[10px] text-muted-foreground">Notify before renewal</p></div>
              <Switch checked={formData.reminderEnabled} onCheckedChange={v => setFormData(p => ({...p, reminderEnabled: v}))} aria-label="Toggle reminders" />
            </div>
            {formData.reminderEnabled && (
              <div className="space-y-1">
                <Label className="text-xs">Remind X days before</Label>
                <Input type="number" min="1" max="30" value={formData.reminderDays} onChange={e => setFormData(p => ({...p, reminderDays: parseInt(e.target.value)}))} className="h-9 text-sm" />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">{editingSubscription ? 'Update' : 'Add'}</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setShowAddModal(false); setEditingSubscription(null); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
