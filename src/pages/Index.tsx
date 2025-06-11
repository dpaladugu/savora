
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AddExpense } from "@/components/expense/add-expense";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "add":
        return <AddExpense />;
      case "search":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center pb-24">
            <div className="text-center p-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Search</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center pb-24">
            <div className="text-center p-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        );
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
