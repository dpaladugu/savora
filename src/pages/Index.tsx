
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
import { useAppStore } from "@/store/appStore"; // Import Zustand store
import { PinLock } from "@/components/auth/PinLock"; // Import PinLock component

const Index = () => {
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const unlockApp = useAppStore((state) => state.unlockApp); // To be called by PinLock on success

  const { user, loading: authLoading } = useAuth(); // Renamed loading to authLoading
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  // TODO: Add logic for initial PIN setup and API key encryption if not already done.
  // For now, PinLock has simulated success. We need to store encrypted API key
  // and PinLock should decrypt it and call unlockApp(decryptedApiKey).

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

  // Handle unlock success from PinLock
  // PinLock component itself is now responsible for calling the unlockApp action in the store
  // with the decrypted API key. This function is purely a callback to signal success.
  const handleUnlockSuccess = () => {
    console.log("PINLock reported success (Setup or Unlock). App should now be unlocked.");
    // No need to call unlockApp here anymore, PinLock does it.
    // The component will re-render due to 'isUnlocked' changing in the Zustand store.
  };

  if (!isUnlocked) {
    return <PinLock onUnlockSuccess={handleUnlockSuccess} />;
  }

  // If unlocked, then proceed with auth check and app display
  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <AuthScreen />
        {/* Or EnhancedAuthScreen, depending on which one is primary */}
      </ErrorBoundary>
    );
  }

  // User is authenticated and PIN is unlocked
  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        <AnimatePresence>
          {showWelcome && (
            <WelcomeScreen onComplete={handleWelcomeComplete} />
          )}
        </AnimatePresence>
        
        {!showWelcome && (
          <div className="pb-20 md:pb-0"> {/* Add padding-bottom for mobile nav, remove for md and up if nav changes */}
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
          </div> // Corrected: Closing div tag instead of fragment
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
