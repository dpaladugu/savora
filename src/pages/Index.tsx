
import React from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { useAppStore, useIsUnlocked } from "@/store/appStore";
import { PinLock } from "@/components/auth/PinLock";
import { db } from "@/db";

const Index = () => {
  console.log('Index: Component mounting');
  console.log('Index: React context check:', React);
  
  const isUnlocked = useIsUnlocked();
  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  const [isAppInitialized, setAppInitialized] = React.useState(false);
  const [hasExistingUser, setHasExistingUser] = React.useState<boolean | undefined>(undefined);
  const [hasPin, setHasPin] = React.useState(false);

  React.useEffect(() => {
    console.log('Index: useEffect for initial state checking');
    async function checkInitialState() {
      try {
        const existingUser = await db.appSettings.get('userPersonalProfile_v1');
        console.log('Index: Existing user check result:', !!existingUser);
        setHasExistingUser(!!existingUser);

        if (existingUser) {
          const pinLastSet = await db.appSettings.get('pinLastSet');
          console.log('Index: PIN check result:', !!pinLastSet);
          setHasPin(!!pinLastSet);
        }
      } catch (error) {
        console.error("Index: Error checking initial state:", error);
        setHasExistingUser(false);
        setHasPin(false);
      } finally {
        setAppInitialized(true);
        console.log('Index: App initialization completed');
      }
    }

    checkInitialState();
  }, []);

  const handleUnlockSuccess = () => {
    console.log('Index: handleUnlockSuccess called');
    setHasExistingUser(true);
    setHasPin(true);
  };

  const handleOnboardingComplete = () => {
    console.log('Index: handleOnboardingComplete called');
    setHasExistingUser(true);
    setHasPin(true);
  };

  console.log('Index: Render state - initialized:', isAppInitialized, 'hasUser:', hasExistingUser, 'hasPin:', hasPin, 'isUnlocked:', isUnlocked);

  if (!isAppInitialized) {
    console.log('Index: Rendering LoadingScreen');
    return <LoadingScreen />;
  }

  if (!hasExistingUser) {
    console.log('Index: Rendering WelcomeScreen');
    console.log('Index: About to render WelcomeScreen - Router context should be available');
    return <WelcomeScreen onComplete={handleOnboardingComplete} />;
  }

  if (hasPin && !isUnlocked) {
    console.log('Index: Rendering PinLock');
    return <PinLock onUnlockSuccess={handleUnlockSuccess} />;
  }

  console.log('Index: Rendering main app interface');
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
