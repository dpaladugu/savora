
import { useState, useEffect } from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { AuthScreen } from "@/components/auth/enhanced-auth-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { AnimatePresence } from "framer-motion";
import { useAppStore, useIsUnlocked } from "@/store/appStore"; // Import Zustand store & specific selector
import { PinLock } from "@/components/auth/PinLock"; // Import PinLock component
import { db } from "@/db";

const Index = () => {
  const isUnlocked = useIsUnlocked();
  const { user, loading: authLoading } = useAuth();
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [isAppInitialized, setAppInitialized] = useState(false);
  const [hasExistingUser, setHasExistingUser] = useState<boolean | undefined>(undefined);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    async function checkInitialState() {
      const existingUser = await db.appSettings.get('userPersonalProfile_v1');
      setHasExistingUser(!!existingUser);

      if (existingUser) {
        const pinSettings = await db.appSettings.get('pinConfig');
        setHasPin(!!pinSettings);
      }

      setAppInitialized(true);
    }

    checkInitialState();
  }, []);

  const handleUnlockSuccess = () => {
    // The component will re-render due to 'isUnlocked' changing in the Zustand store.
  };

  if (!isAppInitialized || authLoading) {
    return <LoadingScreen />;
  }

  if (!hasExistingUser) {
    return <WelcomeScreen onComplete={() => setHasExistingUser(true)} />;
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
