
import { Home, Receipt, CreditCard, TrendingUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

interface PersistentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

export function PersistentNavigation({
  activeTab,
  onTabChange,
  onMoreNavigation
}: PersistentNavigationProps) {
  
  const mainTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "credit-cards", label: "Cards", icon: CreditCard },
    { id: "investments", label: "Investments", icon: TrendingUp },
  ];

  const moreModules = [
    { id: "emergency-fund", label: "Emergency Fund", icon: "💰", description: "Calculate and track your emergency corpus" },
    { id: "goals", label: "Goals & SIPs", icon: "🎯", description: "Financial goals and SIP tracking" },
    { id: "rentals", label: "Rental Properties", icon: "🏠", description: "Track rental income and expenses" },
    { id: "recommendations", label: "Smart Tips", icon: "💡", description: "Personalized financial recommendations" },
    { id: "cashflow", label: "Cashflow Analysis", icon: "📊", description: "Income vs expense analysis" },
    { id: "upload", label: "Import CSV", icon: "📁", description: "Import Axio, Kuvera data" },
    { id: "telegram", label: "Telegram Bot", icon: "🤖", description: "Connect Telegram for quick updates" },
    { id: "settings", label: "Settings", icon: "⚙️", description: "App preferences and data export" },
  ];

  const handleMoreModuleClick = (moduleId: string) => {
    if (moduleId === "upload" || moduleId === "goals" || moduleId === "settings") {
      onTabChange(moduleId);
    } else {
      onMoreNavigation(moduleId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {mainTabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 h-12 px-3 ${
              activeTab === tab.id || (tab.id === "investments" && activeTab === "more")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Button>
        ))}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-12 px-3 ${
                activeTab === "more"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>More Features</SheetTitle>
            </SheetHeader>
            <div className="grid gap-3 mt-6">
              {moreModules.map((module) => (
                <Card 
                  key={module.id} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleMoreModuleClick(module.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="text-2xl">{module.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{module.label}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
