
import { motion } from "framer-motion";
import { Home, Plus, Search, Settings } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "add", icon: Plus, label: "Add" },
    { id: "search", icon: Search, label: "Search" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 nav-glass border-t border-border/50">
      <div className="flex items-center justify-around h-20 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center p-3 relative min-w-[64px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/15 dark:bg-primary/20 rounded-xl border border-primary/25"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <tab.icon 
                className={`w-6 h-6 mb-1 transition-colors duration-300 relative z-10 ${
                  isActive 
                    ? "text-primary" 
                    : "text-foreground/70 hover:text-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              
              <span className={`text-xs font-medium transition-colors duration-300 relative z-10 text-label ${
                isActive 
                  ? "text-primary" 
                  : "text-foreground/70 hover:text-foreground"
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
