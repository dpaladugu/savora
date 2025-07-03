import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileJson, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { preloadFinancialData, validateFinancialData } from '@/services/dataPreloaderService'; // Import actual services

export function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
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
        const data = JSON.parse(text);

        if (!validateFinancialData(data)) { // Use actual service
          throw new Error('Invalid JSON structure. Please check the file content and ensure all required sections are present.');
        }

        if (window.confirm("Importing will replace ALL existing application data with the content of this file. This cannot be undone. Are you sure you want to proceed?")) {
            const result = await preloadFinancialData(data); // Use actual service
            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: result.message,
                });
                // Optionally display result.summary details
                console.log("Import Summary:", result.summary);
                setFile(null); // Clear file input
            } else {
                throw new Error(result.message);
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
          <FileJson className="w-5 h-5 text-primary" />
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
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {/* Used actual RefreshCw */}
              Importing...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Import Data & Replace All
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Ensure your JSON file is correctly formatted. Download a sample template if unsure (feature coming soon).
        </p>
      </CardContent>
    </Card>
  );
}
// Removed placeholder RefreshCwIcon
