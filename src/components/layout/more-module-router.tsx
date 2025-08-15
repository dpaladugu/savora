import React from 'react';
import { EmergencyFund } from '@/components/more/EmergencyFund';
import { RentalManager } from '@/components/RentalManager';
import { Recommendations } from '@/components/more/Recommendations';
import { CashFlow } from '@/components/more/CashFlow';
import { TelegramIntegration } from '@/components/more/TelegramIntegration';
import { CreditCardManager } from '@/components/credit-cards/CreditCardManager';
import { CreditCardStatements } from '@/components/credit-cards/CreditCardStatements';
import { RecurringTransactions } from '@/components/expenses/RecurringTransactions';
import { GoldTracker } from '@/components/gold/gold-tracker';
import { LoanManager } from '@/components/loans/loan-manager';
import { InsuranceTracker } from '@/components/insurance/insurance-tracker';
import { VehicleManager } from '@/components/vehicles/VehicleManager';

interface MoreModuleRouterProps {
  activeModule:
  | 'emergency-fund'
  | 'rentals'
  | 'recommendations'
  | 'cashflow'
  | 'telegram'
  | 'credit-cards'
  | 'credit-card-statements'
  | 'recurring-transactions'
  | 'gold'
  | 'loans'
  | 'insurance'
  | 'vehicles'
  | null;
  onBackClick: () => void;
}

export function MoreModuleRouter({ activeModule, onBackClick }: MoreModuleRouterProps) {
  switch (activeModule) {
    case 'emergency-fund':
      return <EmergencyFund />;
    case 'rentals':
      return <RentalManager />;
    case 'recommendations':
      return <Recommendations />;
    case 'cashflow':
      return <CashFlow />;
    case 'telegram':
      return <TelegramIntegration />;
    case 'credit-cards':
      return <CreditCardManager />;
    case 'credit-card-statements':
      return <CreditCardStatements />;
    case 'recurring-transactions':
      return <RecurringTransactions />;
    case 'gold':
      return <GoldTracker />;
    case 'loans':
      return <LoanManager />;
    case 'insurance':
      return <InsuranceTracker />;
    case 'vehicles':
      return <VehicleManager />;
    default:
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Select a module to view details.</p>
        </div>
      );
  }
}
