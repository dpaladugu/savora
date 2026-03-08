
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Shield, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format-utils";

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
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Monthly Requirement</h3>
              <p className="text-sm text-muted-foreground">Including all factors</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(calculation.monthlyRequired)}
          </div>
        </CardContent>
      </Card>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Emergency Fund Target</h3>
              <p className="text-sm text-muted-foreground">{emergencyMonths} months coverage</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(calculation.emergencyFundRequired)}
          </div>
        </CardContent>
      </Card>

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Users className="w-5 h-5 text-accent" />
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
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    calculation.currentCoverage >= emergencyMonths ? 'bg-success' :
                    calculation.currentCoverage >= emergencyMonths * 0.7 ? 'bg-warning' : 'bg-destructive'
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
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Shortfall</h3>
              <p className="text-sm text-muted-foreground">Amount needed</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(calculation.shortfall)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
