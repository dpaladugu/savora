
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function SettingsPage() {
  const exportData = async () => {
    try {
      const data = {
        txns: await db.txns.toArray(),
        rentalProperties: await db.rentalProperties.toArray(),
        creditCards: await db.creditCards.toArray(),
        loans: await db.loans.toArray(),
        goals: await db.goals.toArray(),
        policies: await db.policies.toArray(),
        vehicles: await db.vehicles.toArray(),
        healthProfiles: await db.healthProfiles.toArray(),
        wallets: await db.wallets.toArray(),
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'savora-backup.json';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your app preferences and data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toggle between light and dark themes</p>
              </div>
              <DarkModeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download all your data as JSON backup</p>
              </div>
              <Button onClick={exportData} variant="outline">
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Savora v1.0 - Your personal finance management companion
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
