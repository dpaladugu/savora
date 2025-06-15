
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, Users, TrendingUp } from "lucide-react";

interface EmergencyFundCalculation {
  monthlyRequired: number;
  emergencyFundRequired: number;
  currentCoverage: number;
  shortfall: number;
}

interface EmergencyFundResultsProps {
  calculation: EmergencyFundCalculation;
  emergencyMonths: number;
}

export function EmergencyFundResults({ calculation, emergencyMonths }: EmergencyFundResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Monthly Requirement</h3>
              <p className="text-sm text-muted-foreground">Including all factors</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            ₹{calculation.monthlyRequired.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Emergency Fund Target</h3>
              <p className="text-sm text-muted-foreground">{emergencyMonths} months coverage</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            ₹{calculation.emergencyFundRequired.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Current Coverage</h3>
              <p className="text-sm text-muted-foreground">Months covered</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {calculation.currentCoverage} months
          </div>
          {calculation.currentCoverage > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    calculation.currentCoverage >= emergencyMonths ? 'bg-green-500' : 
                    calculation.currentCoverage >= emergencyMonths * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((calculation.currentCoverage / emergencyMonths) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Shortfall</h3>
              <p className="text-sm text-muted-foreground">Amount needed</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            ₹{calculation.shortfall.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
