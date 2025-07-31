
import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { useAppStore } from "@/store/appStore";
import { PinLock } from "@/components/auth/PinLock";
import { Auth } from "@/components/auth/Auth";
import { db } from "@/lib/db";
import { seedInitialData } from "@/lib/seed-data";
import { performStartupVerification, logStartupResults } from "@/utils/startup-verification";

const MainApp = () => {
  // Move hooks to the top level and add error handling
  let isUnlocked = false;
  try {
    isUnlocked = useAppStore((state) => state.isUnlocked);
  } catch (error) {
    console.error('Error accessing app store:', error);
  }

  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();
  
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

const Index = () => {
  console.log('Index: Component mounting');
  
  // Use direct store access with error handling instead of selector hook
  let isUnlocked = false;
  try {
    isUnlocked = useAppStore((state) => state.isUnlocked);
  } catch (error) {
    console.error('Index: Error accessing store:', error);
  }

  const navigate = useNavigate();
  const [isAppInitialized, setAppInitialized] = React.useState(false);
  const [hasExistingUser, setHasExistingUser] = React.useState<boolean | undefined>(undefined);
  const [hasPin, setHasPin] = React.useState(false);

  React.useEffect(() => {
    console.log('Index: useEffect for initial state checking');
    async function checkInitialState() {
      try {
        // Run startup verification
        const startupChecks = await performStartupVerification();
        logStartupResults(startupChecks);
        
        // Check for critical errors
        const criticalErrors = startupChecks.filter(c => c.status === 'error');
        if (criticalErrors.length > 0) {
          console.warn('Critical startup errors detected:', criticalErrors);
        }

        // Initialize the database and seed data if needed
        await seedInitialData();

        const existingUser = await db.getPersonalProfile();
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
    navigate('/dashboard');
  };

  const handleOnboardingComplete = async () => {
    console.log('Index: handleOnboardingComplete called');
    try {
      // Create a basic user profile
      const profile = {
        name: 'Demo User',
        email: 'demo@savora.app',
        createdAt: new Date().toISOString()
      };
      await db.savePersonalProfile(profile);
      
      setHasExistingUser(true);
      setHasPin(false); // No PIN set yet
      console.log('Index: Profile created, proceeding to main app');
    } catch (error) {
      console.error('Index: Error creating profile:', error);
    }
  };

  console.log('Index: Render state - initialized:', isAppInitialized, 'hasUser:', hasExistingUser, 'hasPin:', hasPin, 'isUnlocked:', isUnlocked);

  if (!isAppInitialized) {
    console.log('Index: Rendering LoadingScreen');
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={
        <>
          {!hasExistingUser ? (
            <WelcomeScreen onComplete={handleOnboardingComplete} />
          ) : hasPin && !isUnlocked ? (
            <PinLock onUnlockSuccess={handleUnlockSuccess} />
          ) : (
            <MainApp />
          )}
        </>
      } />
    </Routes>
  );
};

export default Index;
