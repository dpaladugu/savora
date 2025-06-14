
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { GoalsManager } from "@/components/goals/goals-manager";
import { CSVUpload } from "@/components/csv/csv-upload";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { ExpenseTracker } from "@/components/expenses/expense-tracker";
import { IncomeTracker } from "@/components/income/income-tracker";
import { InsuranceTracker } from "@/components/insurance/insurance-tracker";
import { GoldTracker } from "@/components/gold/gold-tracker";
import { RentalTracker } from "@/components/rentals/rental-tracker";
import { CreditCardManager } from "@/components/credit-cards/credit-card-manager";
import { VehicleManager } from "@/components/vehicles/vehicle-manager";
import { AccountManager } from "@/components/accounts/account-manager";
import { RecurringGoals } from "@/components/goals/recurring-goals";
import { MoreScreen } from "@/components/more/more-screen";
import { CSVImports } from "@/components/imports/csv-imports";
import { CreditCardTracker } from "@/components/credit-cards/credit-card-tracker";
import { SimpleGoalsTracker } from "@/components/goals/simple-goals-tracker";
import { SuggestionsEngine } from "@/components/suggestions/suggestions-engine";
import { UpcomingPayments } from "@/components/reminders/upcoming-payments";
import { AuthScreen } from "@/components/auth/auth-screen";
import { useAuth } from "@/contexts/auth-context";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  // Always call hooks at the top level in the same order
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeMoreModule, setActiveMoreModule] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // All useEffect hooks should be called unconditionally
  useEffect(() => {
    if (user) {
      // Check if user has seen welcome screen before
      const hasSeenWelcome = localStorage.getItem("savora-welcome-seen");
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  // Reset more module when switching away from more tab
  useEffect(() => {
    if (activeTab !== "more") {
      setActiveMoreModule(null);
    }
  }, [activeTab]);

  const handleWelcomeComplete = () => {
    localStorage.setItem("savora-welcome-seen", "true");
    setShowWelcome(false);
  };

  const handleCSVDataParsed = (data: any[]) => {
    // TODO: Firebase integration - process parsed CSV data
    console.log("TODO: Process CSV data with Firebase:", data);
  };

  const handleMoreNavigation = (moduleId: string) => {
    setActiveMoreModule(moduleId);
  };

  const handleBackToMore = () => {
    setActiveMoreModule(null);
  };

  const renderMoreContent = () => {
    if (!activeMoreModule) {
      return <MoreScreen onNavigate={handleMoreNavigation} />;
    }

    switch (activeMoreModule) {
      case 'suggestions':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <SuggestionsEngine />
          </div>
        );
      case 'reminders':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <UpcomingPayments />
          </div>
        );
      case 'income':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <IncomeTracker />
          </div>
        );
      case 'credit-cards':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <CreditCardTracker />
          </div>
        );
      case 'accounts':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <AccountManager />
          </div>
        );
      case 'vehicles':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <VehicleManager />
          </div>
        );
      case 'insurance':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <InsuranceTracker />
          </div>
        );
      case 'recurring-goals':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <RecurringGoals />
          </div>
        );
      case 'gold':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <GoldTracker />
          </div>
        );
      case 'rentals':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <RentalTracker />
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
              <p className="text-muted-foreground">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "expenses":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <ExpenseTracker />
          </div>
        );
      case "goals":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <SimpleGoalsTracker />
          </div>
        );
      case "upload":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <CSVImports />
          </div>
        );
      case "settings":
        return <SettingsScreen />;
      case "more":
        return renderMoreContent();
      default:
        return <Dashboard />;
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Savora...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>
      
      {!showWelcome && (
        <>
          {renderContent()}
          <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default Index;
