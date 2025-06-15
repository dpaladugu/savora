
import { GlobalHeader } from "@/components/layout/global-header";
import { useEmergencyFund } from "@/hooks/use-emergency-fund";
import { MissingDataAlert } from "./missing-data-alert";
import { EmergencyFundForm } from "./emergency-fund-form";
import { EmergencyFundResults } from "./emergency-fund-results";
import { SipRecommendation } from "./sip-recommendation";

export function EmergencyFundCalculator() {
  const { data, updateData, loading, missingData, calculation } = useEmergencyFund();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <GlobalHeader title="Emergency Fund Calculator" />
      
      <div className="pt-20 px-4 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your financial data...</p>
          </div>
        ) : (
          <>
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
