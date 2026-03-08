
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
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

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
      {/*
        Layout grid:
          Mobile  (< 768px)  : single column, fixed top header + fixed bottom nav
          Tablet  (768–1024) : single column, fixed top header + fixed bottom nav
          Desktop (≥ 1024px) : fixed top header spans full width;
                               content area is split: 240px left sidebar + flex-1 main
      */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* ── Fixed top header — full width on all devices ── */}
        <GlobalHeader title="Savora" />

        {/* ── Below-header body ── */}
        <div className="flex flex-1 pt-14">
          {/* Desktop/laptop sidebar (hidden on mobile & tablet) */}
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            activeMoreModule={activeMoreModule}
            onMoreNavigation={handleMoreNavigation}
          />

          {/*
            Main scroll area
            Mobile/tablet : full width, pb-20 for bottom nav
            Desktop        : remaining width, no bottom nav padding
          */}
          <main
            id="main-content"
            tabIndex={-1}
            className="
              flex-1 min-w-0 overflow-y-auto
              px-3 sm:px-4 py-4
              pb-[calc(80px+env(safe-area-inset-bottom,0px))]
              md:pb-[calc(80px+env(safe-area-inset-bottom,0px))]
              lg:pb-6 lg:px-8
              focus:outline-none
            "
          >
            {/* Content width cap — centres on ultra-wide screens */}
            <div className="max-w-3xl mx-auto">
              <MainContentRouter
                activeTab={activeTab}
                activeMoreModule={activeMoreModule}
                onMoreNavigation={handleMoreNavigation}
                onTabChange={handleTabChange}
              />
            </div>
          </main>
        </div>

        {/* ── Fixed bottom nav — mobile & tablet only ── */}
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
