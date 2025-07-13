import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileJson, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { preloadFinancialData } from '@/services/dataPreloaderService';
import { validateFinancialData } from '@/services/enhanced-data-validator';

export function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummaryMessage, setImportSummaryMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a JSON file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        setImportSummaryMessage(null); // Reset summary message

        const validationResult = validateFinancialData(jsonData); // Use actual service

        if (!validationResult.isValid || !validationResult.data) {
          let errorMessages = "Invalid JSON structure. Please check the file content.";
          if (validationResult.errors) {
            errorMessages = validationResult.errors.map(err => `${err.path.join('.')} - ${err.message}`).join('\n');
          }
          toast({
            title: "Validation Failed",
            description: <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto">{errorMessages}</pre>,
            variant: "destructive",
            duration: 10000, // Show for longer
          });
          setIsImporting(false);
          return;
        }

        if (window.confirm("Importing will replace ALL existing application data (like expenses and vehicles) with the content of this file. This cannot be undone. Are you sure you want to proceed?")) {
            const importResult = await preloadFinancialData(validationResult.data); // Use validated and typed data
            if (importResult.success) {
                toast({
                    title: "Import Successful",
                    description: importResult.message,
                });
                setImportSummaryMessage(importResult.message + (importResult.summary ? ` Details: ${JSON.stringify(importResult.summary)}` : ''));
                setFile(null); // Clear file input
            } else {
                // PreloadFinancialData itself might have a detailed error message
                toast({
                    title: "Import Partially Failed or Errored",
                    description: importResult.message,
                    variant: "destructive",
                });
                setImportSummaryMessage(`Import failed: ${importResult.message}`);
            }
        } else {
            toast({
                title: "Import Cancelled",
                description: "Data import was cancelled by the user.",
            });
        }

      } catch (error: any) {
        console.error("Import error:", error);
        toast({
          title: "Import Failed",
          description: error.message || "An error occurred during import.",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      console.error("File reading error:", reader.error);
      toast({
        title: "File Reading Error",
        description: "Could not read the selected file.",
        variant: "destructive",
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson aria-hidden="true" className="w-5 h-5 text-primary" />
          Preload Financial Data
        </CardTitle>
        <CardDescription>
          Import your complete financial profile via a single JSON file.
          This will replace any existing data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={isImporting}
        />
        {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
        <Button
          className="w-full"
          onClick={handleImport}
          disabled={!file || isImporting}
        >
          {isImporting ? (
            <>
              <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> {/* Used actual RefreshCw */}
              Importing...
            </>
          ) : (
            <>
              <UploadCloud aria-hidden="true" className="mr-2 h-4 w-4" />
              Import Data & Replace All
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Ensure your JSON file is correctly formatted. Download a sample template if unsure (feature coming soon).
        </p>
        {importSummaryMessage && (
          <div className={`mt-4 p-3 rounded-md text-sm ${importSummaryMessage.startsWith("Import failed") ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-500/30'}`}>
            <p className="font-semibold mb-1">Import Status:</p>
            <pre className="whitespace-pre-wrap">{importSummaryMessage}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// Removed placeholder RefreshCwIcon
