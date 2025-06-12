
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AddExpense } from "@/components/expense/add-expense";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { GoalsManager } from "@/components/goals/goals-manager";
import { CSVUpload } from "@/components/csv/csv-upload";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { TelegramPlaceholder } from "@/components/telegram/telegram-placeholder";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
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
    // TODO: Process parsed CSV data
    console.log("CSV data parsed:", data);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
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
      case "telegram":
        return <TelegramPlaceholder />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <Dashboard />;
    }
  };

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
