
export function CSVHelpText() {
  return (
    <div className="text-xs text-muted-foreground space-y-2">
      <p><strong>Supported formats:</strong></p>
      <ul className="ml-4 space-y-1">
        <li>• Axio/Walnut expense exports</li>
        <li>• Kuvera mutual fund statements</li>
        <li>• Credit card transaction statements</li>
        <li>• Bank account statements</li>
        <li>• Generic CSV files (with manual mapping)</li>
      </ul>
      <p className="mt-2"><strong>Auto-detection:</strong></p>
      <ul className="ml-4 space-y-1">
        <li>• Automatically detects file format</li>
        <li>• Smart categorization of transactions</li>
        <li>• Handles multiple date formats</li>
        <li>• Provides manual mapping fallback</li>
      </ul>
    </div>
  );
}
