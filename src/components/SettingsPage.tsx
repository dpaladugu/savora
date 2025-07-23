
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { exportData } from '@/lib/export';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { Download, Trash2, FileJson, Settings } from 'lucide-react';

export function SettingsPage() {
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `savora-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const handleResetDb = async () => {
    if (import.meta.env.DEV && confirm('Are you sure you want to reset the database? This will delete all data.')) {
      try {
        await db.delete();
        await db.open();
        localStorage.removeItem('seedLoaded');
        toast.success('Database reset successfully');
      } catch (error) {
        toast.error('Failed to reset database');
        console.error('Reset error:', error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <DarkModeToggle />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">Download all your data as JSON backup</p>
              </div>
              <Button onClick={handleExport} variant="outline">
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
            
            {import.meta.env.DEV && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reset Database</p>
                  <p className="text-sm text-muted-foreground">Delete all data (development only)</p>
                </div>
                <Button onClick={handleResetDb} variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset DB
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Savora v1.0 - Your personal finance management companion
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
