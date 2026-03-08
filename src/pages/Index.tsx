
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
import { GlobalHeader } from "@/components/layout/global-header";

const MainApp = () => {
  let isUnlocked = false;
  try {
    isUnlocked = useAppStore((state) => state.isUnlocked);
  } catch (error) {
    console.error('Error accessing app store:', error);
  }

  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();

  return (
    <GlobalErrorBoundary>
      {/* Full-height flex column so content fills between header and nav */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Fixed top header */}
        <GlobalHeader title="Savora" />

        {/* Scrollable content area — pt accounts for fixed header (56px), pb for nav (72px) */}
        <main
          className="flex-1 px-4 pt-[70px] pb-[80px] overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          <MainContentRouter
            activeTab={activeTab}
            activeMoreModule={activeMoreModule}
            onMoreNavigation={handleMoreNavigation}
            onTabChange={handleTabChange}
          />
        </main>

        {/* Persistent bottom nav */}
        <PersistentNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeMoreModule={activeMoreModule}
          onMoreNavigation={handleMoreNavigation}
        />
      </div>
    </GlobalErrorBoundary>
  );
};

const Index = () => {
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
    async function checkInitialState() {
      try {
        const startupChecks = await performStartupVerification();
        logStartupResults(startupChecks);
        await seedInitialData();
        const settings = await db.globalSettings.toArray();
        setHasExistingUser(settings.length > 0);
        setHasPin(false);
      } catch (error) {
        console.error("Index: Error checking initial state:", error);
        setHasExistingUser(false);
        setHasPin(false);
      } finally {
        setAppInitialized(true);
      }
    }
    checkInitialState();
  }, []);

  const handleUnlockSuccess = () => {
    setHasExistingUser(true);
    setHasPin(true);
    navigate('/dashboard');
  };

  const handleOnboardingComplete = async () => {
    try {
      await seedInitialData();
      setHasExistingUser(true);
      setHasPin(false);
    } catch (error) {
      console.error('Index: Error creating profile:', error);
    }
  };

  if (!isAppInitialized) return <LoadingScreen />;

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
