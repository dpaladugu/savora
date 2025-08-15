
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

// Extended Dependent interface with additional fields
interface ExtendedDependent extends Dependent {
  id?: string;
  gender?: 'M' | 'F';
  chronic?: boolean;
  schoolFeesAnnual?: number;
  isNominee?: boolean;
}

export function GlobalSettingsManager() {
  const { toast } = useToast();
  const { setPrivacyMask } = useAppStore();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    phone: '',
    relation: ''
  });
  const [newDependent, setNewDependent] = useState<Partial<ExtendedDependent>>({
    name: '',
    dob: new Date(),
    relation: '',
    gender: 'M',
    chronic: false,
    isNominee: false
  });
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDependentDialog, setShowDependentDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const globalSettings = await GlobalSettingsService.getGlobalSettings();
      setSettings(globalSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load global settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (updates: Partial<GlobalSettings>) => {
    try {
      await GlobalSettingsService.updateGlobalSettings(updates);
      if (settings) {
        setSettings({ ...settings, ...updates });
      }
      
      // Update app store if privacy mask changed
      if ('privacyMask' in updates) {
        setPrivacyMask(updates.privacyMask!);
      }
      
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all contact fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const contact: Contact = {
        name: newContact.name,
        phone: newContact.phone,
        relation: newContact.relation
      };
      
      await GlobalSettingsService.addEmergencyContact(contact);
      await loadSettings();
      setNewContact({ name: '', phone: '', relation: '' });
      setShowContactDialog(false);
      
      toast({
        title: "Contact Added",
        description: "Emergency contact has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add emergency contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addDependent = async () => {
    if (!newDependent.name || !newDependent.relation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required dependent fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dependent: Dependent = {
        name: newDependent.name!,
        dob: newDependent.dob || new Date(),
        relation: newDependent.relation!
      };
      
      const updatedDependents = [...(settings?.dependents || []), dependent];
      await updateSetting({ dependents: updatedDependents });
      setNewDependent({
        name: '',
        dob: new Date(),
        relation: '',
        gender: 'M',
        chronic: false,
        isNominee: false
      });
      setShowDependentDialog(false);
      
      toast({
        title: "Dependent Added",
        description: "Dependent has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding dependent:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add dependent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeEmergencyContact = async (index: number) => {
    if (!settings) return;
    
    const updatedContacts = settings.emergencyContacts.filter((_, i) => i !== index);
    await updateSetting({ emergencyContacts: updatedContacts });
  };

  const removeDependent = async (index: number) => {
    if (!settings) return;
    
    const updatedDependents = settings.dependents.filter((_, i) => i !== index);
    await updateSetting({ dependents: updatedDependents });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Progress value={33} className="w-64" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load settings. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Global Settings</h2>
        <p className="text-muted-foreground">Configure your app preferences and security settings</p>
      </div>

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            App
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="privacy-mask">Privacy Mask</Label>
                  <p className="text-sm text-muted-foreground">Hide sensitive amounts by default</p>
                </div>
                <Switch
                  id="privacy-mask"
                  checked={settings.privacyMask}
                  onCheckedChange={(checked) => updateSetting({ privacyMask: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="auto-lock">Auto Lock (minutes)</Label>
                <div className="px-3">
                  <Slider
                    id="auto-lock"
                    min={1}
                    max={10}
                    step={1}
                    value={[settings.autoLockMinutes]}
                    onValueChange={(value) => updateSetting({ autoLockMinutes: value[0] })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
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
                  <Progress 
                    value={(settings.failedPinAttempts / settings.maxFailedAttempts) * 100} 
                    className="flex-1"
                  />
                  <Badge variant={settings.failedPinAttempts > 5 ? "destructive" : "secondary"}>
                    {settings.failedPinAttempts}/{settings.maxFailedAttempts}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  App will self-destruct after {settings.maxFailedAttempts} failed attempts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-regime">Tax Regime</Label>
                  <Select 
                    value={settings.taxRegime} 
                    onValueChange={(value: 'Old' | 'New') => updateSetting({ taxRegime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New Tax Regime</SelectItem>
                      <SelectItem value="Old">Old Tax Regime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary-credit-day">Salary Credit Day</Label>
                  <Input
                    id="salary-credit-day"
                    type="number"
                    min="1"
                    max="31"
                    value={settings.salaryCreditDay}
                    onChange={(e) => updateSetting({ salaryCreditDay: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annual-bonus">Annual Bonus (₹)</Label>
                  <Input
                    id="annual-bonus"
                    type="number"
                    value={settings.annualBonus}
                    onChange={(e) => updateSetting({ annualBonus: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday-budget">Birthday Budget (₹)</Label>
                  <Input
                    id="birthday-budget"
                    type="number"
                    value={settings.birthdayBudget}
                    onChange={(e) => updateSetting({ birthdayBudget: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Inflation Rates (%)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical-inflation">Medical Inflation</Label>
                    <Input
                      id="medical-inflation"
                      type="number"
                      step="0.1"
                      value={settings.medicalInflationRate}
                      onChange={(e) => updateSetting({ medicalInflationRate: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education-inflation">Education Inflation</Label>
                    <Input
                      id="education-inflation"
                      type="number"
                      step="0.1"
                      value={settings.educationInflation}
                      onChange={(e) => updateSetting({ educationInflation: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle-inflation">Vehicle Inflation</Label>
                    <Input
                      id="vehicle-inflation"
                      type="number"
                      step="0.1"
                      value={settings.vehicleInflation}
                      onChange={(e) => updateSetting({ vehicleInflation: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenance-inflation">Maintenance Inflation</Label>
                    <Input
                      id="maintenance-inflation"
                      type="number"
                      step="0.1"
                      value={settings.maintenanceInflation}
                      onChange={(e) => updateSetting({ maintenanceInflation: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthday-alert-days">Birthday Alert Days</Label>
                <Input
                  id="birthday-alert-days"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.birthdayAlertDays}
                  onChange={(e) => updateSetting({ birthdayAlertDays: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Days before birthday to show reminder
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Emergency Contacts
                <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Emergency Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Name</Label>
                        <Input
                          id="contact-name"
                          value={newContact.name || ''}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">Phone</Label>
                        <Input
                          id="contact-phone"
                          value={newContact.phone || ''}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-relation">Relation</Label>
                        <Input
                          id="contact-relation"
                          value={newContact.relation || ''}
                          onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                        />
                      </div>
                      <Button onClick={addEmergencyContact} className="w-full">
                        Add Contact
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.emergencyContacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No emergency contacts added</p>
              ) : (
                <div className="space-y-2">
                  {settings.emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone} • {contact.relation}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmergencyContact(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dependents
                </span>
                <Dialog open={showDependentDialog} onOpenChange={setShowDependentDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Dependent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Dependent</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dependent-name">Name</Label>
                        <Input
                          id="dependent-name"
                          value={newDependent.name || ''}
                          onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dependent-relation">Relation</Label>
                        <Select
                          value={newDependent.relation || ''}
                          onValueChange={(value) => setNewDependent({ ...newDependent, relation: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Child">Child</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Grandmother">Grandmother</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dependent-dob">Date of Birth</Label>
                        <Input
                          id="dependent-dob"
                          type="date"
                          value={newDependent.dob?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setNewDependent({ ...newDependent, dob: new Date(e.target.value) })}
                        />
                      </div>
                      <Button onClick={addDependent} className="w-full">
                        Add Dependent
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.dependents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No dependents added</p>
              ) : (
                <div className="space-y-2">
                  {settings.dependents.map((dependent, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{dependent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dependent.relation} • Born: {dependent.dob.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDependent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark theme</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting({ darkMode: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="theme">Theme Preference</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting({ theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Input
                  id="timezone"
                  value={settings.timeZone}
                  onChange={(e) => updateSetting({ timeZone: e.target.value })}
                  readOnly
                />
                <p className="text-sm text-muted-foreground">
                  Time zone is set automatically based on your location
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="test-mode">Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable real notifications and nudges</p>
                </div>
                <Switch
                  id="test-mode"
                  checked={settings.isTest}
                  onCheckedChange={(checked) => updateSetting({ isTest: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="reveal-secret">Reveal Secret</Label>
                <Input
                  id="reveal-secret"
                  type="password"
                  value={settings.revealSecret}
                  onChange={(e) => updateSetting({ revealSecret: e.target.value })}
                  placeholder="Set a secret to reveal masked data"
                />
                <p className="text-sm text-muted-foreground">
                  Used to temporarily reveal masked financial data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
