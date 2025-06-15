
import { FileText } from "lucide-react";

interface CSVFileUploadProps {
  onFileSelect: (file: File) => void;
  processing: boolean;
}

export function CSVFileUpload({ onFileSelect, processing }: CSVFileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Select CSV File
      </label>
      <div
        className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Click to select CSV file or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports Axio, Kuvera, and Credit Card formats
        </p>
      </div>
      <input
        id="csv-file-input"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={processing}
      />
      
      {processing && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Processing CSV...</p>
        </div>
      )}
    </div>
  );
}
