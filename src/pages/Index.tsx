
import { useState } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AddExpense } from "@/components/expense/add-expense";
import { MobileNav } from "@/components/layout/mobile-nav";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "add":
        return <AddExpense />;
      case "search":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center pb-24">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Search</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center pb-24">
            <div className="text-center">
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
      {renderContent()}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
