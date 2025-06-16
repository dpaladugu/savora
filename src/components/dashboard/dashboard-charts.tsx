
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function DashboardCharts() {
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
          <ExpenseChart />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={
          <Card className="metric-card border-border/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load asset allocation</p>
            </CardContent>
          </Card>
        }>
          <AssetAllocation />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
