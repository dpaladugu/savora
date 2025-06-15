
import { Home, Receipt, CreditCard, TrendingUp, MoreHorizontal } from "lucide-react";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { memo, useState } from "react";
import { Logger } from "@/services/logger";
import { MoreScreen } from "@/components/more/more-screen";

interface PersistentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

export const PersistentNavigation = memo(function PersistentNavigation({
  activeTab,
  onTabChange,
  onMoreNavigation
}: PersistentNavigationProps) {
  
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  
  const mainTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home, ariaLabel: "Navigate to dashboard" },
    { id: "expenses", label: "Expenses", icon: Receipt, ariaLabel: "Navigate to expenses" },
    { id: "credit-cards", label: "Cards", icon: CreditCard, ariaLabel: "Navigate to credit cards" },
    { id: "investments", label: "Investments", icon: TrendingUp, ariaLabel: "Navigate to investments" },
  ];

  const handleTabClick = (tabId: string) => {
    Logger.info('Navigation tab clicked', { tabId, currentTab: activeTab });
    onTabChange(tabId);
    setIsMoreSheetOpen(false); // Close more sheet if open
  };

  const handleMoreModuleClick = (moduleId: string) => {
    Logger.info('More module clicked', { moduleId });
    if (moduleId === "upload" || moduleId === "goals" || moduleId === "settings") {
      onTabChange(moduleId);
    } else {
      onMoreNavigation(moduleId);
    }
    setIsMoreSheetOpen(false); // Close the sheet after selection
  };

  const handleMoreSheetClose = () => {
    setIsMoreSheetOpen(false);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-border"
      role="navigation" 
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {mainTabs.map((tab) => (
          <AccessibleButton
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => handleTabClick(tab.id)}
            ariaLabel={tab.ariaLabel}
            className={`flex flex-col items-center gap-1 h-12 px-3 transition-colors duration-200 ${
              activeTab === tab.id || (tab.id === "investments" && activeTab === "more")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-medium">{tab.label}</span>
          </AccessibleButton>
        ))}
        
        <Sheet open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
          <SheetTrigger asChild>
            <AccessibleButton
              variant="ghost"
              size="sm"
              ariaLabel="Open more options menu"
              className={`flex flex-col items-center gap-1 h-12 px-3 transition-colors duration-200 ${
                activeTab === "more"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium">More</span>
            </AccessibleButton>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
            <SheetHeader>
              <SheetTitle>More Features</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <MoreScreen 
                onNavigate={handleMoreModuleClick}
                onClose={handleMoreSheetClose}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
});
