
import { useState, useEffect } from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { AuthScreen } from "@/components/auth/auth-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, loading } = useAuth();
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem("savora-welcome-seen");
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    localStorage.setItem("savora-welcome-seen", "true");
    setShowWelcome(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <AuthScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default Index;
