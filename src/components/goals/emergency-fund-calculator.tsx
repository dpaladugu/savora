
import { GlobalHeader } from "@/components/layout/global-header";
import { useEmergencyFund } from "@/hooks/use-emergency-fund";
import { MissingDataAlert } from "./missing-data-alert";
import { EmergencyFundForm } from "./emergency-fund-form";
import { EmergencyFundResults } from "./emergency-fund-results";
import { SipRecommendation } from "./sip-recommendation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function EmergencyFundCalculator() {
  const { data, updateData, loading, missingData, calculation, refreshData } = useEmergencyFund();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="Emergency Fund Calculator" />
      
      <div className="pt-20 px-4 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading data from your financial modules...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Data integrated from: Expenses, Insurance, EMI & Rental modules
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
            </div>
            
            <MissingDataAlert missingData={missingData} />
            <EmergencyFundForm data={data} onUpdate={updateData} />
            <EmergencyFundResults calculation={calculation} emergencyMonths={data.emergencyMonths} />
            <SipRecommendation shortfall={calculation.shortfall} />
          </>
        )}
      </div>
    </div>
  );
}
