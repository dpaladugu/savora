import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileJson, RefreshCw } from "lucide-react"; // Added RefreshCw
import { useToast } from '@/hooks/use-toast';
// import { preloadFinancialData } from '@/services/dataPreloaderService'; // To be created
// import { validateFinancialData } from '@/services/dataValidator'; // To be created

// Placeholder for preloadFinancialData - will be moved to a service
async function placeholderPreloadFinancialData(data: any): Promise<void> {
  console.log("Attempting to preload data:", data);
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Simulate success/failure
  if (data && data.personal_profile) { // Basic check
    console.log("Data appears valid, simulation successful.");
    return Promise.resolve();
  } else {
    console.log("Simulated data validation failed.");
    return Promise.reject(new Error("Simulated: Invalid JSON structure for preload."));
  }
}

// Placeholder for validateFinancialData - will be moved to a service
function placeholderValidateFinancialData(data: any): boolean {
  const requiredSections = [
    'personal_profile',
    'income_cash_flows',
    'assets',
    'liabilities',
    'financial_goals'
  ];
  const isValid = requiredSections.every(section => data[section] !== undefined);
  console.log("Data validation result:", isValid);
  return isValid;
}


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

        // TODO: Replace with actual validateFinancialData from service
        if (!placeholderValidateFinancialData(data)) {
          throw new Error('Invalid JSON structure. Ensure all required sections are present.');
        }

        // TODO: Replace with actual preloadFinancialData from service
        // This will clear existing data and add new data. User should be warned.
        // Consider adding a confirmation dialog before this step.
        if (window.confirm("Importing will replace existing data. Are you sure?")) {
            await placeholderPreloadFinancialData(data);
            toast({
                title: "Import Successful",
                description: "Financial data imported successfully!",
                variant: "default", // Changed from success as it's not a Shadcn variant
            });
            setFile(null); // Clear file input
        } else {
            toast({
                title: "Import Cancelled",
                description: "Data import was cancelled by the user.",
                variant: "default",
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
