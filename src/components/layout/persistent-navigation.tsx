
import * as React from "react";
import { Home, Receipt, CreditCard, TrendingUp, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logger } from "@/services/logger";
import { MoreScreen } from "@/components/more/more-screen";

interface PersistentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

const mainTabs = [
  { id: "dashboard",   label: "Dashboard",    icon: Home,         ariaLabel: "Navigate to dashboard" },
  { id: "expenses",    label: "Expenses",      icon: Receipt,      ariaLabel: "Navigate to expenses" },
  { id: "credit-cards", label: "Cards",        icon: CreditCard,   ariaLabel: "Navigate to credit cards" },
  { id: "investments", label: "Invest",        icon: TrendingUp,   ariaLabel: "Navigate to investments" },
];

export const PersistentNavigation = React.memo(function PersistentNavigation({
  activeTab,
  onTabChange,
  activeMoreModule,
  onMoreNavigation,
}: PersistentNavigationProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = React.useState(false);
  // Track when we're closing the sheet due to a module selection (not user dismiss)
  const closingForModuleRef = React.useRef(false);

  React.useEffect(() => {
    if (activeTab !== "more") setIsMoreSheetOpen(false);
  }, [activeTab]);

  React.useEffect(() => {
    if (activeMoreModule) setIsMoreSheetOpen(false);
  }, [activeMoreModule]);

  const propsRef = React.useRef({ activeTab, onTabChange, activeMoreModule });
  React.useEffect(() => {
    propsRef.current = { activeTab, onTabChange, activeMoreModule };
  }, [activeTab, onTabChange, activeMoreModule]);

  const handleTabClick = (tabId: string) => {
    Logger.info("Navigation tab clicked", { tabId });
    onTabChange(tabId);
  };

  const handleMoreModuleClick = (moduleId: string) => {
    Logger.info("More module clicked", { moduleId });
    closingForModuleRef.current = true;
    if (["upload", "goals", "settings"].includes(moduleId)) {
      onTabChange(moduleId);
    } else {
      onMoreNavigation(moduleId);
    }
    setIsMoreSheetOpen(false);
  };

  const handleMoreClick = () => {
    setIsMoreSheetOpen(true);
    onTabChange("more");
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      // If we're closing because a module was selected, don't reset to dashboard
      if (closingForModuleRef.current) {
        closingForModuleRef.current = false;
        setIsMoreSheetOpen(false);
        return;
      }
      // User dismissed the sheet without selecting a module
      setIsMoreSheetOpen(false);
      if (propsRef.current.activeTab === "more" && !propsRef.current.activeMoreModule) {
        propsRef.current.onTabChange("dashboard");
      }
    } else {
      setIsMoreSheetOpen(true);
    }
  };

  const isActive = (id: string) => activeTab === id;
  const isMoreActive = activeTab === "more" && !activeMoreModule;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden enhanced-nav-glass border-t border-border/30 nav-safe-bottom"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {mainTabs.map((tab) => {
          const active = isActive(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              aria-label={tab.ariaLabel}
              aria-current={active ? "page" : undefined}
              className={`
                flex flex-col items-center justify-center gap-0.5
                min-w-[60px] min-h-[56px] px-3 py-2 rounded-2xl
                transition-all duration-200 ease-out focus-ring
                ${active
                  ? "nav-pill-active text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }
              `}
            >
              <tab.icon
                aria-hidden="true"
                className={`transition-all duration-200 ${
                  active ? "w-5 h-5 scale-110" : "w-5 h-5"
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium leading-none ${active ? "" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* ── More sheet trigger ── */}
        <Sheet open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
          <SheetTrigger asChild>
            <button
              onClick={handleMoreClick}
              aria-label="Open more options menu"
              aria-expanded={isMoreSheetOpen}
              aria-controls="more-sheet"
              className={`
                flex flex-col items-center justify-center gap-0.5
                min-w-[60px] min-h-[56px] px-3 py-2 rounded-2xl
                transition-all duration-200 ease-out focus-ring
                ${isMoreActive
                  ? "nav-pill-active text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }
              `}
            >
              <MoreHorizontal
                aria-hidden="true"
                className={`transition-all duration-200 ${isMoreActive ? "w-5 h-5 scale-110" : "w-5 h-5"}`}
                strokeWidth={isMoreActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          </SheetTrigger>

          <SheetContent
            id="more-sheet"
            side="bottom"
            className="h-[84vh] overflow-y-auto glass-deep rounded-t-3xl border-t-0 p-0"
            onInteractOutside={handleMoreSheetClose}
          >
            {/* ── Drag indicator ── */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            </div>

            <SheetHeader className="px-5 pt-2 pb-3">
              <SheetTitle className="text-left text-lg font-semibold">More Features</SheetTitle>
            </SheetHeader>

            <div className="px-1 pb-8 scrollbar-thin">
              <MoreScreen onNavigate={handleMoreModuleClick} onClose={handleMoreSheetClose} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
});
