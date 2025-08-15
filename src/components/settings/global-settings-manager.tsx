
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, DollarSign, Bell, User, Settings, Code, Plus, Trash2 } from 'lucide-react';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import type { GlobalSettings, Contact, Dependent } from '@/lib/db';

export const GlobalSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setPrivacyMask } = useAppStore();
  const { toast } = useToast();

  // Emergency contact form state
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    phone: '',
    relation: 'Father'
  });

  // Dependent form state
  const [newDependent, setNewDependent] = useState<Partial<Dependent>>({
    name: '',
    relation: 'Child',
    dob: new Date(),
    gender: 'M',
    chronic: false,
    isNominee: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const globalSettings = await GlobalSettingsService.getGlobalSettings();
      setSettings(globalSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (updates: Partial<GlobalSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      await GlobalSettingsService.updateGlobalSettings(updates);
      setSettings({ ...settings, ...updates });
      
      // Update app store if privacy mask changed
      if ('privacyMask' in updates) {
        setPrivacyMask(updates.privacyMask!);
      }

      toast({
        title: 'Settings Updated',
        description: 'Your settings have been saved successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all contact details',
        variant: 'destructive'
      });
      return;
    }

    try {
      await GlobalSettingsService.addEmergencyContact(newContact);
      await loadSettings(); // Reload to get updated contacts
      setNewContact({ name: '', phone: '', relation: 'Father' });
      toast({
        title: 'Contact Added',
        description: 'Emergency contact has been added successfully'
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add emergency contact',
        variant: 'destructive'
      });
    }
  };

  const removeEmergencyContact = async (index: number) => {
    if (!settings) return;

    const updatedContacts = settings.emergencyContacts.filter((_, i) => i !== index);
    await updateSetting({ emergencyContacts: updatedContacts });
  };

  const addDependent = async () => {
    if (!newDependent.name || !newDependent.dob) {
      toast({
        title: 'Error',
        description: 'Please fill in required dependent details',
        variant: 'destructive'
      });
      return;
    }

    if (!settings) return;

    const dependent: Dependent = {
      id: crypto.randomUUID(),
      name: newDependent.name!,
      relation: newDependent.relation as Dependent['relation'],
      dob: newDependent.dob!,
      gender: newDependent.gender!,
      chronic: newDependent.chronic || false,
      isNominee: newDependent.isNominee || false
    };

    const updatedDependents = [...settings.dependents, dependent];
    await updateSetting({ dependents: updatedDependents });
    
    setNewDependent({
      name: '',
      relation: 'Child',
      dob: new Date(),
      gender: 'M',
      chronic: false,
      isNominee: false
    });
  };

  const removeDependent = async (id: string) => {
    if (!settings) return;

    const updatedDependents = settings.dependents.filter(dep => dep.id !== id);
    await updateSetting({ dependents: updatedDependents });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Progress value={undefined} className="w-64" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load settings</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Global Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and configuration</p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            App
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Control data visibility and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Privacy Mask</Label>
                    <p className="text-sm text-muted-foreground">Hide sensitive amounts by default</p>
                  </div>
                  <Switch
                    checked={settings.privacyMask}
                    onCheckedChange={(checked) => updateSetting({ privacyMask: checked })}
                    disabled={isSaving}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Auto Lock Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="autoLock">Auto Lock (minutes)</Label>
                      <Input
                        id="autoLock"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.autoLockMinutes}
                        onChange={(e) => updateSetting({ autoLockMinutes: parseInt(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAttempts">Max Failed Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        value={settings.maxFailedAttempts}
                        onChange={(e) => updateSetting({ maxFailedAttempts: parseInt(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Security Alert</p>
                      <p className="text-sm text-yellow-700">
                        Failed PIN attempts: {settings.failedPinAttempts}/{settings.maxFailedAttempts}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Configuration</CardTitle>
                <CardDescription>Set up financial defaults and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxRegime">Tax Regime</Label>
                    <Select
                      value={settings.taxRegime}
                      onValueChange={(value) => updateSetting({ taxRegime: value as 'Old' | 'New' })}
                      disabled={isSaving}
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
                  <div>
                    <Label htmlFor="salaryDay">Salary Credit Day</Label>
                    <Input
                      id="salaryDay"
                      type="number"
                      min="1"
                      max="31"
                      value={settings.salaryCreditDay}
                      onChange={(e) => updateSetting({ salaryCreditDay: parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Inflation Rates (%)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medicalInflation">Medical Inflation</Label>
                      <Input
                        id="medicalInflation"
                        type="number"
                        step="0.1"
                        value={settings.medicalInflationRate}
                        onChange={(e) => updateSetting({ medicalInflationRate: parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="educationInflation">Education Inflation</Label>
                      <Input
                        id="educationInflation"
                        type="number"
                        step="0.1"
                        value={settings.educationInflation}
                        onChange={(e) => updateSetting({ educationInflation: parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleInflation">Vehicle Inflation</Label>
                      <Input
                        id="vehicleInflation"
                        type="number"
                        step="0.1"
                        value={settings.vehicleInflation}
                        onChange={(e) => updateSetting({ vehicleInflation: parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maintenanceInflation">Maintenance Inflation</Label>
                      <Input
                        id="maintenanceInflation"
                        type="number"
                        step="0.1"
                        value={settings.maintenanceInflation}
                        onChange={(e) => updateSetting({ maintenanceInflation: parseFloat(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="annualBonus">Annual Bonus (₹)</Label>
                  <Input
                    id="annualBonus"
                    type="number"
                    value={settings.annualBonus}
                    onChange={(e) => updateSetting({ annualBonus: parseInt(e.target.value) })}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alert Settings */}
        <TabsContent value="alerts">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthdayBudget">Birthday Budget (₹)</Label>
                    <Input
                      id="birthdayBudget"
                      type="number"
                      value={settings.birthdayBudget}
                      onChange={(e) => updateSetting({ birthdayBudget: parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthdayAlert">Birthday Alert (days before)</Label>
                    <Input
                      id="birthdayAlert"
                      type="number"
                      value={settings.birthdayAlertDays}
                      onChange={(e) => updateSetting({ birthdayAlertDays: parseInt(e.target.value) })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Settings */}
        <TabsContent value="personal">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>Manage emergency contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.emergencyContacts.length === 0 ? (
                    <p className="text-muted-foreground">No emergency contacts added</p>
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
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <Input
                      placeholder="Contact Name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      disabled={isSaving}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      disabled={isSaving}
                    />
                    <div className="flex gap-2">
                      <Select
                        value={newContact.relation}
                        onValueChange={(value) => setNewContact({ ...newContact, relation: value })}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Friend">Friend</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addEmergencyContact} disabled={isSaving}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dependents</CardTitle>
                <CardDescription>Manage family member information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.dependents.length === 0 ? (
                    <p className="text-muted-foreground">No dependents added</p>
                  ) : (
                    <div className="space-y-2">
                      {settings.dependents.map((dependent) => {
                        const currentDate = new Date();
                        const birthDate = new Date(dependent.dob);
                        let age = currentDate.getFullYear() - birthDate.getFullYear();
                        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
                          age--;
                        }

                        return (
                          <div key={dependent.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{dependent.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {dependent.relation} • Age {age} • {dependent.gender}
                                {dependent.chronic && <Badge variant="secondary" className="ml-2">Chronic</Badge>}
                                {dependent.isNominee && <Badge variant="outline" className="ml-2">Nominee</Badge>}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDependent(dependent.id)}
                              disabled={isSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <Input
                      placeholder="Name"
                      value={newDependent.name || ''}
                      onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                      disabled={isSaving}
                    />
                    <Select
                      value={newDependent.relation}
                      onValueChange={(value) => setNewDependent({ ...newDependent, relation: value as Dependent['relation'] })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Grandmother">Grandmother</SelectItem>
                        <SelectItem value="Brother">Brother</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newDependent.dob?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setNewDependent({ ...newDependent, dob: new Date(e.target.value) })}
                      disabled={isSaving}
                    />
                    <Button onClick={addDependent} disabled={isSaving}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>Configure app behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting({ darkMode: checked })}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Input
                    id="timezone"
                    value={settings.timeZone}
                    onChange={(e) => updateSetting({ timeZone: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => updateSetting({ theme: value as 'light' | 'dark' | 'system' })}
                    disabled={isSaving}
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
                <CardDescription>Developer and test settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable real notifications in development</p>
                  </div>
                  <Switch
                    checked={settings.isTest}
                    onCheckedChange={(checked) => updateSetting({ isTest: checked })}
                    disabled={isSaving}
                  />
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Danger Zone</p>
                      <p className="text-sm text-red-700">
                        Settings in this section can affect app stability and security.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
