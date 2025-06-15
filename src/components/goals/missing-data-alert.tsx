
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";

interface MissingDataAlertProps {
  missingData: string[];
}

export function MissingDataAlert({ missingData }: MissingDataAlertProps) {
  if (missingData.length === 0) return null;

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
          For more accurate emergency fund calculations, please add:
        </p>
        {missingData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-orange-900 rounded-lg">
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">{item}</span>
            <Button size="sm" variant="outline">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
