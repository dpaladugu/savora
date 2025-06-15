
import { MetricSection } from "./metric-section";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { DashboardMetricsProps } from "@/types/dashboard";

export function DashboardMetrics({ 
  dashboardData, 
  loading, 
  onTabChange, 
  onMoreNavigation 
}: DashboardMetricsProps) {
  const { primaryMetrics, secondaryMetrics } = useDashboardMetrics(
    dashboardData,
    loading,
    onTabChange,
    onMoreNavigation
  );

  return (
    <>
      <MetricSection 
        title=""
        metrics={primaryMetrics}
        delay={0}
      />
      <MetricSection 
        title=""
        metrics={secondaryMetrics}
        delay={primaryMetrics.length * 0.1}
      />
    </>
  );
}
