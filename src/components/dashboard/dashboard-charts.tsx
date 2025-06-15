
import { ExpenseChart } from "./expense-chart";
import { AssetAllocation } from "./asset-allocation";

export function DashboardCharts() {
  return (
    <div className="space-y-6 px-2">
      <ExpenseChart />
      <AssetAllocation />
    </div>
  );
}
