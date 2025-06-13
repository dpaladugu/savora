
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
import { MoreScreen } from "@/components/more/more-screen";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeMoreModule, setActiveMoreModule] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome screen before
    const hasSeenWelcome = localStorage.getItem("savora-welcome-seen");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

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
      case 'income':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <IncomeTracker />
          </div>
        );
      case 'insurance':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <InsuranceTracker />
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
            <GoalsManager />
          </div>
        );
      case "upload":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                Import Data
              </h1>
              <p className="text-muted-foreground text-lg font-medium">
                Upload your expense data from CSV files
              </p>
            </div>
            <CSVUpload onDataParsed={handleCSVDataParsed} />
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

  // Reset more module when switching away from more tab
  useEffect(() => {
    if (activeTab !== "more") {
      setActiveMoreModule(null);
    }
  }, [activeTab]);

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
