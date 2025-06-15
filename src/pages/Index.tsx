
import { useState, useEffect } from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { AuthScreen } from "@/components/auth/auth-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { useAuth } from "@/contexts/auth-context";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeMoreModule, setActiveMoreModule] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem("savora-welcome-seen");
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  useEffect(() => {
    // Clear more module when switching away from more tab
    if (activeTab !== "more") {
      setActiveMoreModule(null);
    }
  }, [activeTab]);

  const handleWelcomeComplete = () => {
    localStorage.setItem("savora-welcome-seen", "true");
    setShowWelcome(false);
  };

  const handleMoreNavigation = (moduleId: string) => {
    setActiveTab("more");
    setActiveMoreModule(moduleId);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear more module when changing tabs
    if (tab !== "more") {
      setActiveMoreModule(null);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>
      
      {!showWelcome && (
        <>
          <MainContentRouter 
            activeTab={activeTab}
            activeMoreModule={activeMoreModule}
            onMoreNavigation={handleMoreNavigation}
            onTabChange={handleTabChange}
          />
          <PersistentNavigation 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            activeMoreModule={activeMoreModule}
            onMoreNavigation={handleMoreNavigation}
          />
        </>
      )}
    </div>
  );
};

export default Index;
