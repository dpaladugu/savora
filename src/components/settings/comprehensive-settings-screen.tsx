
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Settings, Moon, Sun, Shield, Bell, Download, Trash2, 
  Clock, Globe, Palette, Lock, AlertTriangle, Info,
  Smartphone, Mail, Key, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { UserSettingsService, type UserSettings } from '@/services/UserSettingsService';
import { AuthenticationService } from '@/services/AuthenticationService';
import { useAuth } from '@/contexts/auth-context';

export function ComprehensiveSettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await UserSettingsService.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;

    try {
      const updates = { [key]: value };
      await UserSettingsService.updateUserSettings(updates);
      
      setSettings({ ...settings, [key]: value });
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await UserSettingsService.exportUserData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `savora-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error('Failed to export settings');
    }
  };

  const handleResetPIN = async () => {
    try {
      await UserSettingsService.resetPIN();
      toast.success('PIN reset successfully. You will need to set up a new PIN.');
      logout();
      setShowResetDialog(false);
    } catch (error) {
      toast.error('Failed to reset PIN');
    }
  };

  const handleClearAllData = async () => {
    try {
      await UserSettingsService.clearAllData();
      toast.success('All data cleared successfully');
      logout();
      setShowClearDataDialog(false);
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Failed to load settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your app preferences, security, and personal settings
        </p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <div>
                <Label className="text-base font-medium">Auto-lock Timer</Label>
                <p className="text-sm text-muted-foreground">Automatically lock app after inactivity</p>
              </div>
            </div>
            <Select
              value={settings.autoLockMinutes.toString()}
              onValueChange={(value) => handleSettingChange('autoLockMinutes', parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="2">2 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4" />
              <div>
                <Label className="text-base font-medium">Privacy Mask</Label>
                <p className="text-sm text-muted-foreground">Hide sensitive amounts with masks</p>
              </div>
            </div>
            <Switch
              checked={settings.privacyMask}
              onCheckedChange={(checked) => handleSettingChange('privacyMask', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">PIN Management</Label>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                className="flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                Reset PIN
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Resetting your PIN will log you out and require setting up a new PIN
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              <div>
                <Label className="text-base font-medium">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts and reminders</p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4" />
              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on device</p>
              </div>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              disabled={!settings.notificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select
                value={settings.timeZone}
                onValueChange={(value) => handleSettingChange('timeZone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => handleSettingChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ Indian Rupee</SelectItem>
                  <SelectItem value="USD">$ US Dollar</SelectItem>
                  <SelectItem value="EUR">€ Euro</SelectItem>
                  <SelectItem value="GBP">£ British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Export Settings</Label>
              <p className="text-sm text-muted-foreground">Download your settings and preferences</p>
            </div>
            <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <Separator />

          <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Danger Zone:</strong> The following actions cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              variant="destructive"
              onClick={() => setShowClearDataDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground">
              This will permanently delete all your data including transactions, goals, and settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge variant="outline">1.0.0</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Build</span>
              <span className="text-sm">2024.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm">Web</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset PIN Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset PIN</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will log you out and you'll need to set up a new PIN. Are you sure you want to continue?
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetPIN}>
              Reset PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action will permanently delete all your data including:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li>All transactions and expenses</li>
                  <li>Investment records</li>
                  <li>Goals and targets</li>
                  <li>Settings and preferences</li>
                </ul>
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
