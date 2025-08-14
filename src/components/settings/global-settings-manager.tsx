
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GlobalSettingsService } from '@/services/GlobalSettingsService';
import { useAppStore } from '@/store/appStore';
import type { GlobalSettings } from '@/lib/db';
import { Shield, Clock, Calculator, Users, Bell, Globe } from 'lucide-react';

export function GlobalSettingsManager() {
  const { toast } = useToast();
  const { setPrivacyMask } = useAppStore();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const globalSettings = await GlobalSettingsService.getGlobalSettings();
      setSettings(globalSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<GlobalSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      await GlobalSettingsService.updateGlobalSettings(updates);
      setSettings({ ...settings, ...updates });
      
      // Update privacy mask in app store
      if ('privacyMask' in updates) {
        setPrivacyMask(updates.privacyMask || false);
      }

      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error updating settings",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="app">App</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="privacy-mask">Privacy Mask</Label>
                  <p className="text-sm text-muted-foreground">Hide financial amounts with ₹***.**</p>
                </div>
                <Switch
                  id="privacy-mask"
                  checked={settings.privacyMask}
                  onCheckedChange={(checked) => updateSettings({ privacyMask: checked })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-lock">Auto Lock (minutes)</Label>
                <Select
                  value={settings.autoLockMinutes.toString()}
                  onValueChange={(value) => updateSettings({ autoLockMinutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-attempts">Max Failed PIN Attempts</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  min="3"
                  max="20"
                  value={settings.maxFailedAttempts}
                  onChange={(e) => updateSettings({ maxFailedAttempts: parseInt(e.target.value) })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reveal-secret">Reveal Secret (for privacy mask)</Label>
                <Input
                  id="reveal-secret"
                  type="password"
                  value={settings.revealSecret}
                  onChange={(e) => updateSettings({ revealSecret: e.target.value })}
                  placeholder="Enter secret to reveal masked amounts"
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-regime">Tax Regime</Label>
                <Select
                  value={settings.taxRegime}
                  onValueChange={(value: 'Old' | 'New') => updateSettings({ taxRegime: value })}
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
                <Label htmlFor="salary-day">Salary Credit Day</Label>
                <Input
                  id="salary-day"
                  type="number"
                  min="1"
                  max="31"
                  value={settings.salaryCreditDay}
                  onChange={(e) => updateSettings({ salaryCreditDay: parseInt(e.target.value) })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual-bonus">Annual Bonus (₹)</Label>
                <Input
                  id="annual-bonus"
                  type="number"
                  min="0"
                  value={settings.annualBonus}
                  onChange={(e) => updateSettings({ annualBonus: parseFloat(e.target.value) })}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medical-inflation">Medical Inflation (%)</Label>
                  <Input
                    id="medical-inflation"
                    type="number"
                    step="0.1"
                    value={settings.medicalInflationRate}
                    onChange={(e) => updateSettings({ medicalInflationRate: parseFloat(e.target.value) })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education-inflation">Education Inflation (%)</Label>
                  <Input
                    id="education-inflation"
                    type="number"
                    step="0.1"
                    value={settings.educationInflation}
                    onChange={(e) => updateSettings({ educationInflation: parseFloat(e.target.value) })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-inflation">Vehicle Inflation (%)</Label>
                  <Input
                    id="vehicle-inflation"
                    type="number"
                    step="0.1"
                    value={settings.vehicleInflation}
                    onChange={(e) => updateSettings({ vehicleInflation: parseFloat(e.target.value) })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-inflation">Maintenance Inflation (%)</Label>
                  <Input
                    id="maintenance-inflation"
                    type="number"
                    step="0.1"
                    value={settings.maintenanceInflation}
                    onChange={(e) => updateSettings({ maintenanceInflation: parseFloat(e.target.value) })}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthday-budget">Birthday Budget (₹)</Label>
                <Input
                  id="birthday-budget"
                  type="number"
                  min="0"
                  value={settings.birthdayBudget}
                  onChange={(e) => updateSettings({ birthdayBudget: parseFloat(e.target.value) })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday-alert">Birthday Alert Days</Label>
                <Input
                  id="birthday-alert"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.birthdayAlertDays}
                  onChange={(e) => updateSettings({ birthdayAlertDays: parseInt(e.target.value) })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Emergency Contacts</h4>
                {settings.emergencyContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No emergency contacts added</p>
                ) : (
                  <div className="space-y-2">
                    {settings.emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt('Contact Name:');
                    const phone = prompt('Phone Number:');
                    const relationship = prompt('Relationship:');
                    if (name && phone && relationship) {
                      GlobalSettingsService.addEmergencyContact({ name, phone, relationship });
                      loadSettings();
                    }
                  }}
                >
                  Add Emergency Contact
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Dependents</h4>
                {settings.dependents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dependents added</p>
                ) : (
                  <div className="space-y-2">
                    {settings.dependents.map((dependent, index) => (
                      <div key={index} className="p-2 border rounded">
                        <p className="font-medium">{dependent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Age: {dependent.age}, Relationship: {dependent.relationship}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select
                  value={settings.timeZone}
                  onValueChange={(value) => updateSettings({ timeZone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
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
                  <p className="text-sm text-muted-foreground">Enable testing features</p>
                </div>
                <Switch
                  id="test-mode"
                  checked={settings.isTest}
                  onCheckedChange={(checked) => updateSettings({ isTest: checked })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Current Failed PIN Attempts</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.failedPinAttempts} of {settings.maxFailedAttempts}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
