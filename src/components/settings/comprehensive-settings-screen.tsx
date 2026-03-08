
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Moon, Sun, Shield, Bell, Download, Trash2,
  Clock, Globe, Palette, Lock, AlertTriangle, Info,
  Smartphone, Mail, Key, Database, User, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { UserSettingsService, type UserSettings } from '@/services/UserSettingsService';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/db';

export function ComprehensiveSettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const { logout } = useAuth();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setSettings(await UserSettingsService.getUserSettings());
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    try {
      await UserSettingsService.updateUserSettings({ [key]: value });
      setSettings({ ...settings, [key]: value });
      toast.success('Setting updated');
    } catch {
      toast.error('Failed to update setting');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await UserSettingsService.exportUserData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `savora-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Settings exported');
    } catch {
      toast.error('Failed to export settings');
    }
  };

  const handleResetPIN = async () => {
    try {
      await UserSettingsService.resetPIN();
      toast.success('PIN reset. Set up a new PIN on next login.');
      logout();
      setShowResetDialog(false);
    } catch {
      toast.error('Failed to reset PIN');
    }
  };

  const handleClearAllData = async () => {
    try {
      await UserSettingsService.clearAllData();
      toast.success('All data cleared');
      logout();
      setShowClearDataDialog(false);
    } catch {
      toast.error('Failed to clear data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Failed to load settings
        </CardContent>
      </Card>
    );
  }

  /* ── Reusable row layout ── */
  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 py-0.5">{children}</div>
  );
  const RowLabel = ({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) => (
    <div className="flex items-start gap-3 min-w-0">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <RowLabel
              icon={settings.darkMode ? Moon : Sun}
              title="Dark Mode"
              sub="Switch between light and dark themes"
            />
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(v) => handleSettingChange('darkMode', v)}
              aria-label="Toggle dark mode"
            />
          </Row>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" /> Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <RowLabel icon={Lock} title="Privacy Mask" sub="Hide sensitive amounts by default" />
            <Switch
              checked={settings.privacyMask}
              onCheckedChange={(v) => handleSettingChange('privacyMask', v)}
              aria-label="Toggle privacy mask"
            />
          </Row>

          <Separator />

          <Row>
            <RowLabel icon={Clock} title="Auto-lock" sub="Lock after inactivity" />
            <Select
              value={settings.autoLockMinutes.toString()}
              onValueChange={(v) => handleSettingChange('autoLockMinutes', parseInt(v))}
            >
              <SelectTrigger className="w-28 h-9 text-xs" aria-label="Auto-lock duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 5, 10].map((m) => (
                  <SelectItem key={m} value={m.toString()} className="text-xs">
                    {m} {m === 1 ? 'min' : 'mins'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Separator />

          <div className="space-y-2">
            <RowLabel icon={Key} title="PIN Management" sub="Reset will log you out" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="h-9 text-xs gap-1.5"
            >
              <Key className="h-3.5 w-3.5" aria-hidden="true" /> Reset PIN
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <RowLabel icon={Bell} title="Enable Notifications" sub="Alerts and reminders" />
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(v) => handleSettingChange('notificationsEnabled', v)}
              aria-label="Toggle notifications"
            />
          </Row>
          <Separator />
          <Row>
            <RowLabel icon={Mail} title="Email" sub="Via email" />
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) => handleSettingChange('emailNotifications', v)}
              disabled={!settings.notificationsEnabled}
              aria-label="Toggle email notifications"
            />
          </Row>
          <Separator />
          <Row>
            <RowLabel icon={Smartphone} title="Push" sub="On this device" />
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(v) => handleSettingChange('pushNotifications', v)}
              disabled={!settings.notificationsEnabled}
              aria-label="Toggle push notifications"
            />
          </Row>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-primary" aria-hidden="true" /> Localization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Time Zone</Label>
              <Select value={settings.timeZone} onValueChange={(v) => handleSettingChange('timeZone', v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata" className="text-xs">India (IST)</SelectItem>
                  <SelectItem value="America/New_York" className="text-xs">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Los_Angeles" className="text-xs">Pacific (PT)</SelectItem>
                  <SelectItem value="Europe/London" className="text-xs">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Dubai" className="text-xs">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
              <Select value={settings.currency} onValueChange={(v) => handleSettingChange('currency', v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR" className="text-xs">₹ Indian Rupee</SelectItem>
                  <SelectItem value="USD" className="text-xs">$ US Dollar</SelectItem>
                  <SelectItem value="EUR" className="text-xs">€ Euro</SelectItem>
                  <SelectItem value="GBP" className="text-xs">£ British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-primary" aria-hidden="true" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row>
            <RowLabel icon={Download} title="Export Settings" sub="Download your preferences as JSON" />
            <Button variant="outline" size="sm" onClick={handleExportData} className="h-9 text-xs gap-1.5 shrink-0">
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export
            </Button>
          </Row>

          <Separator />

          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
            <AlertDescription className="text-xs text-destructive">
              <strong>Danger Zone:</strong> Actions below cannot be undone.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDataDialog(true)}
            className="h-9 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" /> About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            {[
              { label: 'Version', value: <Badge variant="outline" className="text-xs">1.0.0</Badge> },
              { label: 'Build',   value: <span className="text-xs text-foreground">2024.1.0</span> },
              { label: 'Platform', value: <span className="text-xs text-foreground">Web (PWA)</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Reset PIN Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Reset PIN</DialogTitle>
          </DialogHeader>
          <Alert className="border-warning/30 bg-warning/5 my-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs">
              This will log you out. You'll need to set up a new PIN.
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleResetPIN}>Reset PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Clear All Data</DialogTitle>
          </DialogHeader>
          <Alert className="border-destructive/30 bg-destructive/5 my-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-xs text-destructive">
              <strong>This permanently deletes:</strong>
              <ul className="mt-1.5 list-disc list-inside space-y-0.5">
                <li>All transactions & expenses</li>
                <li>Investment records</li>
                <li>Goals & targets</li>
                <li>Settings & preferences</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowClearDataDialog(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleClearAllData}>Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
