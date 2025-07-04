
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
import { useAppStore, useIsUnlocked } from "@/store/appStore"; // Import Zustand store & specific selector
import { PinLock } from "@/components/auth/PinLock"; // Import PinLock component

const Index = () => {
  const isUnlocked = useIsUnlocked(); // Using specific selector
  // const unlockApp = useAppStore((state) => state.unlockApp); // Old unlockApp, replaced by setDecryptedAiConfig
  const setDecryptedAiConfig = useAppStore((state) => state.setDecryptedAiConfig);


  console.log("Index rendering, isUnlocked:", isUnlocked); // DEBUG LOG

  const { user, loading: authLoading } = useAuth(); // Renamed loading to authLoading
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    console.log("Index: useEffect for user run. User:", user); // DEBUG LOG
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
  // PinLock component itself is now responsible for calling setDecryptedAiConfig action in the store.
  // This function is purely a callback to signal success from PinLock's perspective.
  const handleUnlockSuccess = () => {
    console.log("Index: PinLock reported success (onUnlockSuccess callback triggered). App 'isUnlocked' state should be true via Zustand.");
    // The component will re-render due to 'isUnlocked' changing in the Zustand store.
  };

  if (!isUnlocked) {
    console.log("Index: Rendering PinLock because isUnlocked is false."); // DEBUG LOG
    return <PinLock onUnlockSuccess={handleUnlockSuccess} />;
  }

  // If unlocked, then proceed with auth check and app display
  console.log("Index: isUnlocked is true. Proceeding to auth check. AuthLoading:", authLoading); // DEBUG LOG
  if (authLoading) {
    console.log("Index: Auth is loading, rendering LoadingScreen."); // DEBUG LOG
    return <LoadingScreen />;
  }

  if (!user) {
    console.log("Index: User not authenticated, rendering AuthScreen."); // DEBUG LOG
    return (
      <ErrorBoundary>
        <AuthScreen />
        {/* Or EnhancedAuthScreen, depending on which one is primary */}
      </ErrorBoundary>
    );
  }

  // User is authenticated and PIN is unlocked
  console.log("Index: User authenticated and app unlocked. Rendering main content or welcome screen."); // DEBUG LOG
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
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
