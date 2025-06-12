
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Investment {
  id: string;
  type: 'Mutual Fund' | 'PPF' | 'EPF' | 'NPS' | 'Gold';
  name: string;
  amount: number;
  date: string;
  currentValue?: number;
}

const mockInvestments: Investment[] = [
  {
    id: '1',
    type: 'Mutual Fund',
    name: 'HDFC Top 100 Fund',
    amount: 25000,
    date: '2024-01-01',
    currentValue: 26500
  },
  {
    id: '2',
    type: 'PPF',
    name: 'PPF Account',
    amount: 150000,
    date: '2024-01-01',
    currentValue: 152000
  },
  {
    id: '3',
    type: 'Gold',
    name: 'Digital Gold',
    amount: 50000,
    date: '2024-01-01',
    currentValue: 52000
  }
];

export function InvestmentsTracker() {
  const [investments] = useState<Investment[]>(mockInvestments);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
  const totalGains = totalCurrent - totalInvested;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investments</h2>
          <p className="text-muted-foreground">Track your investment portfolio</p>
        </div>
        <Button className="bg-gradient-blue hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invested</p>
                <p className="text-lg font-bold text-foreground">₹{totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold text-foreground">₹{totalCurrent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalGains >= 0 ? 'bg-gradient-green' : 'bg-gradient-orange'} text-white`}>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gains/Loss</p>
                <p className={`text-lg font-bold ${totalGains >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totalGains.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <div className="space-y-3">
        {investments.map((investment, index) => (
          <motion.div
            key={investment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{investment.name}</h4>
                    <p className="text-sm text-muted-foreground">{investment.type}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Invested: ₹{investment.amount.toLocaleString()}
                      </span>
                      {investment.currentValue && (
                        <span className="text-foreground font-medium">
                          Current: ₹{investment.currentValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {investment.currentValue && (
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        investment.currentValue >= investment.amount ? 'text-success' : 'text-destructive'
                      }`}>
                        {investment.currentValue >= investment.amount ? '+' : ''}
                        ₹{(investment.currentValue - investment.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(((investment.currentValue - investment.amount) / investment.amount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Placeholder Notice */}
      <Card className="metric-card border-border/50 border-dashed">
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Investment Tracking</h3>
          <p className="text-muted-foreground text-sm">
            This is a placeholder module. Full investment tracking features including real-time updates, 
            portfolio analysis, and goal linking will be added in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
