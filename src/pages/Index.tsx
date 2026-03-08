
import React from "react";
import { PersistentNavigation } from "@/components/layout/persistent-navigation";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { MainContentRouter } from "@/components/layout/main-content-router";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { useNavigationRouter } from "@/components/layout/navigation-router";
import { useAppStore } from "@/store/appStore";
import { PinLock } from "@/components/auth/PinLock";
import { db } from "@/lib/db";
import { seedInitialData } from "@/lib/seed-data";
import { performStartupVerification, logStartupResults } from "@/utils/startup-verification";
import { GlobalHeader } from "@/components/layout/global-header";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { useAutoLock } from "@/hooks/use-auto-lock";
import { processRecurringTransactions } from "@/services/RecurringTransactionProcessor";

const MainApp = () => {
  let isUnlocked = false;
  try {
    isUnlocked = useAppStore((state) => state.isUnlocked);
  } catch (error) {
    console.error('Error accessing app store:', error);
  }

  const { activeTab, activeMoreModule, handleTabChange, handleMoreNavigation } = useNavigationRouter();

  // Read auto-lock setting from GlobalSettings (live)
  const autoLockMinutes = useLiveQuery(async () => {
    const settings = await db.globalSettings.toArray();
    return settings[0]?.autoLockMinutes ?? 5;
  }, [], 5);

  useAutoLock(autoLockMinutes);

  return (
    <GlobalErrorBoundary>
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

  if (!hasExistingUser) {
    return <WelcomeScreen onComplete={handleOnboardingComplete} />;
  }

  if (hasPin && !isUnlocked) {
    return <PinLock onUnlockSuccess={handleUnlockSuccess} />;
  }

  return <MainApp />;
};

export default Index;
