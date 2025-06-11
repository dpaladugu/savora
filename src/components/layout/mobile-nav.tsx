
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-20 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center p-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <tab.icon 
                className={`w-6 h-6 mb-1 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`} 
              />
              
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground"
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
