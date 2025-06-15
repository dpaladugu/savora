
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

interface EmergencyFundData {
  monthlyExpenses: number;
  dependents: number;
  monthlyEMIs: number;
  insurancePremiums: number;
  bufferPercentage: number;
  currentCorpus: number;
  rentalIncome: number;
  emergencyMonths: number;
}

interface EmergencyFundFormProps {
  data: EmergencyFundData;
  onUpdate: (field: keyof EmergencyFundData, value: number) => void;
}

export function EmergencyFundForm({ data, onUpdate }: EmergencyFundFormProps) {
  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Emergency Fund Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Essential Monthly Expenses
            </label>
            <Input
              type="number"
              value={data.monthlyExpenses}
              onChange={(e) => onUpdate('monthlyExpenses', Number(e.target.value))}
              placeholder="Monthly expenses"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Emergency Fund Months
            </label>
            <Input
              type="number"
              value={data.emergencyMonths}
              onChange={(e) => onUpdate('emergencyMonths', Number(e.target.value))}
              placeholder="6"
              min="3"
              max="12"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Number of Dependents
            </label>
            <Input
              type="number"
              value={data.dependents}
              onChange={(e) => onUpdate('dependents', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Monthly EMIs
            </label>
            <Input
              type="number"
              value={data.monthlyEMIs}
              onChange={(e) => onUpdate('monthlyEMIs', Number(e.target.value))}
              placeholder="Total EMI amount"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Annual Insurance Premiums
            </label>
            <Input
              type="number"
              value={data.insurancePremiums}
              onChange={(e) => onUpdate('insurancePremiums', Number(e.target.value))}
              placeholder="Health + Motor + Term"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Monthly Rental Income
            </label>
            <Input
              type="number"
              value={data.rentalIncome}
              onChange={(e) => onUpdate('rentalIncome', Number(e.target.value))}
              placeholder="Steady rental income"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Buffer Percentage
            </label>
            <Input
              type="number"
              value={data.bufferPercentage}
              onChange={(e) => onUpdate('bufferPercentage', Number(e.target.value))}
              placeholder="20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Current Emergency Corpus
            </label>
            <Input
              type="number"
              value={data.currentCorpus}
              onChange={(e) => onUpdate('currentCorpus', Number(e.target.value))}
              placeholder="Current savings"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
