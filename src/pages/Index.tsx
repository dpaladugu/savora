
import { useState, useEffect } from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { useAppStore, useIsUnlocked } from "@/store/appStore"; // Import Zustand store & specific selector
import { PinLock } from "@/components/auth/PinLock"; // Import PinLock component
import { db } from "@/db";

const Index = () => {
  const isUnlocked = useIsUnlocked();
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [isAppInitialized, setAppInitialized] = useState(false);
  const [hasExistingUser, setHasExistingUser] = useState<boolean | undefined>(undefined);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    async function checkInitialState() {
      try {
        const existingUser = await db.appSettings.get('userPersonalProfile_v1');
        setHasExistingUser(!!existingUser);

        if (existingUser) {
          const pinLastSet = await db.appSettings.get('pinLastSet');
          setHasPin(!!pinLastSet);
        }
      } catch (error) {
        console.error("Error checking initial state:", error);
        // Handle potential DB errors gracefully
        setHasExistingUser(false);
        setHasPin(false);
      } finally {
        setAppInitialized(true);
      }
    }

    checkInitialState();
  }, []);

  const handleUnlockSuccess = () => {
    // This function is called by PinLock on successful unlock.
    // The global state `isUnlocked` will change, causing a re-render.
    // We can also force a re-check of user state if needed.
    setHasExistingUser(true); // Should already be true, but reaffirms
    setHasPin(true); // Should already be true
  };

  const handleOnboardingComplete = () => {
    setHasExistingUser(true);
    // After onboarding, the user is typically directed to set up a PIN.
    // The PinLock component handles both setup and unlock.
    // We just need to ensure the UI flows to it.
    setHasPin(true); // This will now render the PinLock in 'setup' mode.
  };

  if (!isAppInitialized) {
    return <LoadingScreen />;
  }

  if (!hasExistingUser) {
    return <WelcomeScreen onComplete={handleOnboardingComplete} />;
  }

  if (hasPin && !isUnlocked) {
    return <PinLock onUnlockSuccess={handleUnlockSuccess} />;
  }

  // User is authenticated and PIN is unlocked (or not set)
  return (
    <GlobalErrorBoundary>
      <div className="relative min-h-screen">
        <div className="pb-20 md:pb-0">
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
      </div>
    </GlobalErrorBoundary>
  );
};

export default Index;
