
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import { DashboardData } from "@/types/dashboard";

interface DashboardChartsProps {
  data: DashboardData | null;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="metric-card border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No data available for charts.</p>
          </CardContent>
        </Card>
        <Card className="metric-card border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No data available for charts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 px-2">
        <ErrorBoundary fallback={
          <Card className="metric-card border-border/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load expense chart</p>
            </CardContent>
          </Card>
        }>
          <ExpenseChart data={data.categoryBreakdown} />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={
          <Card className="metric-card border-border/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load asset allocation</p>
            </CardContent>
          </Card>
        }>
          <AssetAllocation data={data.categoryBreakdown} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
