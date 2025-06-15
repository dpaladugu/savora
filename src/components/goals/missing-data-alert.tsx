
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Plus } from "lucide-react";

interface MissingDataAlertProps {
  missingData: string[];
}

export function MissingDataAlert({ missingData }: MissingDataAlertProps) {
  if (missingData.length === 0) {
    return (
      <Card className="metric-card border-green-200 bg-green-50 dark:bg-green-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">All financial data integrated successfully</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="metric-card border-orange-200 bg-orange-50 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertCircle className="w-5 h-5" />
          Complete Your Financial Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-orange-700 dark:text-orange-300">
          For more accurate emergency fund calculations, please add the following data to your respective modules:
        </p>
        {missingData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-orange-900 rounded-lg">
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{item}</span>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="w-3 h-3" />
              Add Data
            </Button>
          </div>
        ))}
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
          💡 Tip: Use the Insurance & EMI, Rental, and Expense modules to add your financial data. The emergency fund calculator will automatically pull this data for accurate calculations.
        </p>
      </CardContent>
    </Card>
  );
}
