
import { motion } from "framer-motion";
import { Home, Receipt, Target, Upload, Settings, MoreHorizontal, TrendingUp, Shield, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersistentNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

export function PersistentNavigation({ 
  activeTab, 
  onTabChange, 
  activeMoreModule, 
  onMoreNavigation 
}: PersistentNavigationProps) {
  const mainTabs = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "expenses", icon: Receipt, label: "Expenses" },
    { id: "goals", icon: Target, label: "Goals" },
    { id: "upload", icon: Upload, label: "Import" },
    { id: "more", icon: MoreHorizontal, label: "More" },
  ];

  const moreModules = [
    { id: "investments", icon: TrendingUp, label: "Investments" },
    { id: "emergency-fund", icon: Shield, label: "Emergency Fund" },
    { id: "rentals", icon: Building, label: "Rentals" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // Show expanded navigation when in "more" section
  if (activeTab === "more") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 nav-glass border-t border-border/50">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Access</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onTabChange("dashboard")}
              className="text-xs"
            >
              Back to Home
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {moreModules.map((module) => {
              const isActive = activeMoreModule === module.id;
              return (
                <motion.button
                  key={module.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onMoreNavigation(module.id)}
                  className="flex flex-col items-center justify-center p-2 relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMoreModule"
                      className="absolute inset-0 bg-primary/15 rounded-lg border border-primary/25"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <module.icon 
                    className={`w-5 h-5 mb-1 relative z-10 ${
                      isActive ? "text-primary" : "text-foreground/80"
                    }`}
                  />
                  <span className={`text-xs font-medium relative z-10 ${
                    isActive ? "text-primary" : "text-foreground/80"
                  }`}>
                    {module.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Standard bottom navigation
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 nav-glass border-t border-border/50">
      <div className="flex items-center justify-around h-20 px-2">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center p-3 relative min-w-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl min-h-[48px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/25"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <tab.icon 
                className={`w-6 h-6 mb-1 transition-colors duration-300 relative z-10 ${
                  isActive ? "text-primary" : "text-foreground/80"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              <span className={`text-xs font-medium transition-colors duration-300 relative z-10 ${
                isActive ? "text-primary" : "text-foreground/80"
              }`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
