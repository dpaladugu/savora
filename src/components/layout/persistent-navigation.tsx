
import * as React from 'react';
import { Home, Receipt, CreditCard, TrendingUp, MoreHorizontal } from "lucide-react";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logger } from "@/services/logger";
import { MoreScreen } from "@/components/more/more-screen";

interface PersistentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

export const PersistentNavigation = React.memo(function PersistentNavigation({
  activeTab,
  onTabChange,
  activeMoreModule,
  onMoreNavigation
}: PersistentNavigationProps) {
  
  const [isMoreSheetOpen, setIsMoreSheetOpen] = React.useState(false);
  
  // Close the sheet when activeTab changes away from 'more'
  React.useEffect(() => {
    if (activeTab !== 'more') {
      setIsMoreSheetOpen(false);
    }
  }, [activeTab]);

  // Close the sheet when a more module is selected
  React.useEffect(() => {
    if (activeMoreModule) {
      setIsMoreSheetOpen(false);
    }
  }, [activeMoreModule]);
  
  const mainTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home, ariaLabel: "Navigate to dashboard" },
    { id: "expenses", label: "Expenses", icon: Receipt, ariaLabel: "Navigate to expenses" },
    { id: "credit-cards", label: "Cards", icon: CreditCard, ariaLabel: "Navigate to credit cards" },
    { id: "investments", label: "Investments", icon: TrendingUp, ariaLabel: "Navigate to investments" },
  ];

  const handleTabClick = (tabId: string) => {
    Logger.info('Navigation tab clicked', { tabId, currentTab: activeTab });
    onTabChange(tabId);
  };

  const handleMoreModuleClick = (moduleId: string) => {
    Logger.info('More module clicked', { moduleId });
    if (moduleId === "upload" || moduleId === "goals" || moduleId === "settings") {
      onTabChange(moduleId);
    } else {
      onMoreNavigation(moduleId);
    }
    setIsMoreSheetOpen(false);
  };

  const handleMoreClick = () => {
    setIsMoreSheetOpen(true);
    onTabChange('more');
  };

  const handleMoreSheetClose = () => {
    // This function is primarily for when the user dismisses the sheet without selecting an item
    // (e.g., by clicking outside or pressing Esc).
    // If an item *was* selected, handleMoreModuleClick would have already initiated navigation.
    setIsMoreSheetOpen(false);

    // Use a timeout to allow React state updates (activeTab, activeMoreModule props) to propagate
    // before checking their values. This helps prevent navigating to dashboard if a module was just selected.
    setTimeout(() => {
      // We need to access the latest props here.
      // This component will re-render if activeTab or activeMoreModule props change.
      // However, this callback might have a stale closure over activeTab and activeMoreModule.
      // To be truly safe, this logic should ideally live where it has access to the most current state,
      // or PersistentNavigation should also use useNavigationRouter to get live state.

      // For now, let's assume the props will update if we delay the check slightly.
      // The check needs to use the component's current props at the time of execution.
      // The props passed to PersistentNavigation are what matter.

      // If, after the sheet closes and state updates have had a chance to settle:
      // 1. The activeTab is still 'more' (meaning we didn't navigate to a main tab like 'goals')
      // 2. AND activeMoreModule is null (meaning no specific 'more' module is active or became active)
      // THEN, it implies the user closed the 'More' sheet without making a persistent selection, so go to dashboard.
      if (propsRef.current.activeTab === 'more' && !propsRef.current.activeMoreModule) {
        propsRef.current.onTabChange('dashboard');
      }
    }, 0);
  };

  // Keep a ref to the latest props to avoid stale closures in setTimeout
  const propsRef = React.useRef({ activeTab, onTabChange, activeMoreModule });
  React.useEffect(() => {
    propsRef.current = { activeTab, onTabChange, activeMoreModule };
  }, [activeTab, onTabChange, activeMoreModule]);


  const isActiveTab = (tabId: string) => {
    // A main tab is active if the current activeTab matches its ID.
    // The "More" button handles its own active state.
    return activeTab === tabId;
  };

  return React.createElement(
    'nav',
    { 
      className: "fixed bottom-0 left-0 right-0 z-50 enhanced-nav-glass border-t border-border/30",
      role: "navigation",
      'aria-label': "Main navigation"
    },
    React.createElement(
      'div',
      { className: "flex items-center justify-around py-2 px-4 max-w-md mx-auto" },
      ...mainTabs.map((tab) =>
        React.createElement(AccessibleButton, {
          key: tab.id,
          variant: "ghost",
          size: "sm",
          onClick: () => handleTabClick(tab.id),
          ariaLabel: tab.ariaLabel,
          className: `flex flex-col items-center gap-1 h-16 px-3 rounded-xl transition-all duration-300 min-w-[64px] min-h-[48px] ${
            isActiveTab(tab.id)
              ? "text-primary bg-primary/20 border border-primary/30 shadow-lg backdrop-blur-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
          }`
        },
        React.createElement(tab.icon, {
          className: `w-5 h-5 transition-all duration-300 ${
            isActiveTab(tab.id) ? "scale-110" : ""
          }`,
          'aria-hidden': "true",
          strokeWidth: isActiveTab(tab.id) ? 2.5 : 2
        }),
        React.createElement('span', {
          className: "text-xs font-medium"
        }, tab.label)
        )
      ),
      React.createElement(Sheet, {
        open: isMoreSheetOpen,
        onOpenChange: setIsMoreSheetOpen
      },
      React.createElement(SheetTrigger, { asChild: true },
        React.createElement(AccessibleButton, {
          variant: "ghost",
          size: "sm",
          onClick: handleMoreClick,
          ariaLabel: "Open more options menu",
          className: `flex flex-col items-center gap-1 h-16 px-3 rounded-xl transition-all duration-300 min-w-[64px] min-h-[48px] ${
            activeTab === "more" && !activeMoreModule
              ? "text-primary bg-primary/20 border border-primary/30 shadow-lg backdrop-blur-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
          }`
        },
        React.createElement(MoreHorizontal, {
          className: `w-5 h-5 transition-all duration-300 ${
            activeTab === "more" && !activeMoreModule ? "scale-110" : ""
          }`,
          'aria-hidden': "true",
          strokeWidth: activeTab === "more" && !activeMoreModule ? 2.5 : 2
        }),
        React.createElement('span', {
          className: "text-xs font-medium"
        }, "More")
        )
      ),
      React.createElement(SheetContent, {
        side: "bottom",
        className: "h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-t border-border/50",
        onInteractOutside: handleMoreSheetClose
      },
      React.createElement(SheetHeader, { className: "pb-4" },
        React.createElement(SheetTitle, { className: "text-left" }, "More Features")
      ),
      React.createElement('div', { className: "mt-2" },
        React.createElement(MoreScreen, {
          onNavigate: handleMoreModuleClick,
          onClose: handleMoreSheetClose
        })
      )
      )
      )
    )
  );
});
