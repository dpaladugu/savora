
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Trash2, Users, Shield, CreditCard, Bell, User, Settings, Zap } from 'lucide-react';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import type { GlobalSettings, Contact, Dependent } from '@/lib/db';

interface ExtendedDependent extends Dependent {
  id?: string;
  gender?: 'M' | 'F';
  chronic?: boolean;
  schoolFeesAnnual?: number;
  isNominee?: boolean;
}

const subTabs = [
  { value: 'security',  icon: Shield,    label: 'Sec',      fullLabel: 'Security'  },
  { value: 'financial', icon: CreditCard, label: 'Fin',      fullLabel: 'Financial' },
  { value: 'alerts',    icon: Bell,       label: 'Alert',    fullLabel: 'Alerts'    },
  { value: 'personal',  icon: User,       label: 'People',   fullLabel: 'Personal'  },
  { value: 'app',       icon: Settings,   label: 'App',      fullLabel: 'App'       },
  { value: 'advanced',  icon: Zap,        label: 'Adv',      fullLabel: 'Advanced'  },
] as const;

export function GlobalSettingsManager() {
  const { toast } = useToast();
  const { setPrivacyMask } = useAppStore();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState<Partial<Contact>>({ name: '', phone: '', relation: '' });
  const [newDependent, setNewDependent] = useState<Partial<ExtendedDependent>>({ name: '', dob: new Date(), relation: '', gender: 'M', chronic: false, isNominee: false });
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDependentDialog, setShowDependentDialog] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setSettings(await GlobalSettingsService.getGlobalSettings());
    } catch {
      toast({ title: 'Error Loading Settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (updates: Partial<GlobalSettings>) => {
    try {
      await GlobalSettingsService.updateGlobalSettings(updates);
      if (settings) setSettings({ ...settings, ...updates });
      if ('privacyMask' in updates) setPrivacyMask(updates.privacyMask!);
      toast({ title: 'Settings Updated' });
    } catch {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      toast({ title: 'Fill all fields', variant: 'destructive' }); return;
    }
    try {
      await GlobalSettingsService.addEmergencyContact({ name: newContact.name, phone: newContact.phone, relation: newContact.relation });
      await loadSettings();
      setNewContact({ name: '', phone: '', relation: '' });
      setShowContactDialog(false);
      toast({ title: 'Contact Added' });
    } catch {
      toast({ title: 'Add Failed', variant: 'destructive' });
    }
  };

  const addDependent = async () => {
    if (!newDependent.name || !newDependent.relation) {
      toast({ title: 'Fill required fields', variant: 'destructive' }); return;
    }
    try {
      const dep: Dependent = { name: newDependent.name!, dob: newDependent.dob || new Date(), relation: newDependent.relation! };
      await updateSetting({ dependents: [...(settings?.dependents || []), dep] });
      setNewDependent({ name: '', dob: new Date(), relation: '', gender: 'M', chronic: false, isNominee: false });
      setShowDependentDialog(false);
    } catch {
      toast({ title: 'Add Failed', variant: 'destructive' });
    }
  };

  const removeEmergencyContact = async (i: number) => {
    if (!settings) return;
    await updateSetting({ emergencyContacts: settings.emergencyContacts.filter((_, idx) => idx !== i) });
  };

  const removeDependent = async (i: number) => {
    if (!settings) return;
    await updateSetting({ dependents: settings.dependents.filter((_, idx) => idx !== i) });
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Progress value={33} className="w-48" /></div>;
  if (!settings) return <div className="text-center p-8"><AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" /><p className="text-muted-foreground">Failed to load. Refresh page.</p></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Global Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">App preferences and security</p>
      </div>

      <Tabs defaultValue="security" className="space-y-4">
        {/*
          6 sub-tabs inside GlobalSettingsManager.
          Strategy: icon-only on ≤360px, icon+short label on ≥360px.
          Use a scrollable flex row — NOT grid (too narrow per cell at 6 cols).
          Each trigger has min-w so it never collapses below readable size.
        */}
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <TabsList className="flex w-max min-w-full gap-0.5 rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto">
            {subTabs.map(({ value, icon: Icon, label, fullLabel }) => (
              <TabsTrigger
                key={value}
                value={value}
                role="tab"
                className="
                  tab-trigger flex items-center justify-center gap-1
                  py-2 px-2.5 rounded-xl font-semibold
                  whitespace-nowrap shrink-0 min-w-[52px]
                  text-[11px]
                  data-[state=active]:bg-background data-[state=active]:shadow-sm
                  data-[state=active]:text-primary text-muted-foreground
                  transition-all duration-150
                "
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {/* Show full label on wider, short on narrow */}
                <span className="hidden sm:inline">{fullLabel}</span>
                <span className="sm:hidden">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Security ── */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security & Privacy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor="privacy-mask">Privacy Mask</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Hide sensitive amounts by default</p>
                </div>
                <Switch id="privacy-mask" checked={settings.privacyMask} onCheckedChange={(v) => updateSetting({ privacyMask: v })} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Auto Lock (minutes)</Label>
                <div className="px-2">
                  <Slider min={1} max={10} step={1} value={[settings.autoLockMinutes]} onValueChange={(v) => updateSetting({ autoLockMinutes: v[0] })} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 min</span>
                    <span className="font-medium">{settings.autoLockMinutes} min</span>
                    <span>10 min</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Failed PIN Attempts</Label>
                <div className="flex items-center gap-2">
                  <Progress value={(settings.failedPinAttempts / settings.maxFailedAttempts) * 100} className="flex-1" />
                  <Badge variant={settings.failedPinAttempts > 5 ? 'destructive' : 'secondary'}>
                    {settings.failedPinAttempts}/{settings.maxFailedAttempts}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Self-destruct after {settings.maxFailedAttempts} failures</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Financial ── */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Financial Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tax Regime</Label>
                  <Select value={settings.taxRegime} onValueChange={(v: 'Old' | 'New') => updateSetting({ taxRegime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New Regime</SelectItem>
                      <SelectItem value="Old">Old Regime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salary Day</Label>
                  <Input type="number" min="1" max="31" value={settings.salaryCreditDay} onChange={(e) => updateSetting({ salaryCreditDay: parseInt(e.target.value) })} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Annual Bonus (₹)</Label>
                  <Input type="number" value={settings.annualBonus} onChange={(e) => updateSetting({ annualBonus: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Birthday Budget (₹)</Label>
                  <Input type="number" value={settings.birthdayBudget} onChange={(e) => updateSetting({ birthdayBudget: parseInt(e.target.value) })} />
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Inflation Rates (%)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'medicalInflationRate',  label: 'Medical' },
                    { key: 'educationInflation',    label: 'Education' },
                    { key: 'vehicleInflation',      label: 'Vehicle' },
                    { key: 'maintenanceInflation',  label: 'Maintenance' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input type="number" step="0.1" value={(settings as any)[key]} onChange={(e) => updateSetting({ [key]: parseFloat(e.target.value) } as any)} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Alerts ── */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Alert Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Birthday Alert Days</Label>
                <Input type="number" min="1" max="30" value={settings.birthdayAlertDays} onChange={(e) => updateSetting({ birthdayAlertDays: parseInt(e.target.value) })} />
                <p className="text-xs text-muted-foreground">Days before birthday to show reminder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Personal ── */}
        <TabsContent value="personal" className="space-y-4">
          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Emergency Contacts</span>
                <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Add Emergency Contact</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      {[
                        { id: 'cn', label: 'Name', key: 'name', placeholder: 'Full name' },
                        { id: 'cp', label: 'Phone', key: 'phone', placeholder: '+91 XXXXX XXXXX' },
                        { id: 'cr', label: 'Relation', key: 'relation', placeholder: 'Parent / Sibling' },
                      ].map(({ id, label, key, placeholder }) => (
                        <div key={id} className="space-y-1.5">
                          <Label htmlFor={id}>{label}</Label>
                          <Input id={id} value={(newContact as any)[key] || ''} onChange={(e) => setNewContact({ ...newContact, [key]: e.target.value })} placeholder={placeholder} />
                        </div>
                      ))}
                      <Button onClick={addEmergencyContact} className="w-full">Add Contact</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.emergencyContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No contacts yet</p>
              ) : (
                <div className="space-y-2">
                  {settings.emergencyContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.relation} · {c.phone}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => removeEmergencyContact(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dependents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Dependents</span>
                <Dialog open={showDependentDialog} onOpenChange={setShowDependentDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Add Dependent</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input value={newDependent.name || ''} onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })} placeholder="Full name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Relation</Label>
                        <Input value={newDependent.relation || ''} onChange={(e) => setNewDependent({ ...newDependent, relation: e.target.value })} placeholder="Child / Parent" />
                      </div>
                      <Button onClick={addDependent} className="w-full">Add Dependent</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.dependents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No dependents yet</p>
              ) : (
                <div className="space-y-2">
                  {settings.dependents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.relation}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => removeDependent(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── App ── */}
        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>App Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Use system preference</p>
                </div>
                <Switch checked={settings.darkMode} onCheckedChange={(v) => updateSetting({ darkMode: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">Enable in-app alerts</p>
                </div>
                <Switch checked={settings.notificationsEnabled} onCheckedChange={(v) => updateSetting({ notificationsEnabled: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Advanced ── */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Advanced Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reveal Secret Passphrase</Label>
                <Input type="password" placeholder="Set custom passphrase..." />
                <p className="text-xs text-muted-foreground">Used in the Reveal Values dialog. Leave blank to use default.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
