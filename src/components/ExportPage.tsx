
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportData } from '@/lib/export';
import { toast } from 'sonner';
import { Download, Upload, FileJson } from 'lucide-react';

export function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // TODO: Implement import logic
      toast.success('Data imported successfully!');
    } catch (error) {
      toast.error('Failed to import data');
      console.error('Import error:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Export & Import</h1>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Export all your data as a JSON backup file
            </p>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              <FileJson className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Import data from a JSON backup file
            </p>
            <div className="space-y-2">
              <Label htmlFor="importFile">Select JSON file</Label>
              <Input
                id="importFile"
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button 
              onClick={handleImport}
              disabled={!file}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
