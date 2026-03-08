
/**
 * Desktop sidebar — visible only on lg+ screens.
 * Mirrors the bottom nav tabs and provides access to all More modules
 * as a collapsible tree, so laptops/desktops have a proper left-nav.
 */
import React from "react";
import {
  Home, Receipt, CreditCard, TrendingUp,
  ChevronDown, ChevronRight,
  Repeat, Shield, Coins,
  Target, Brain, Settings, Sparkles,
  Banknote, AlertCircle, Globe, Bike, Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/store/rbacStore";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { NavigationTab } from "@/types/common";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMoreModule: string | null;
  onMoreNavigation: (moduleId: string) => void;
}

const mainNav = [
  { id: "dashboard",    label: "Dashboard",   icon: Home       },
  { id: "expenses",     label: "Expenses",    icon: Receipt    },
  { id: "credit-cards", label: "Cards",       icon: CreditCard },
  { id: "investments",  label: "Invest",      icon: TrendingUp },
] as const;

const moreModules = [
  { id: "loans",              label: "Loans & EMIs",        icon: Banknote,   roleBlocked: undefined,     roleRequired: undefined   },
  { id: "subscriptions",      label: "Subscriptions",       icon: Repeat,     roleBlocked: undefined,     roleRequired: undefined   },
  { id: "emergency-fund",     label: "Emergency Fund",      icon: AlertCircle,roleBlocked: undefined,     roleRequired: undefined   },
  { id: "brother-global",     label: "Brother's US",        icon: Globe,      roleBlocked: undefined,     roleRequired: "BROTHER" as const },
  { id: "vehicles",           label: "Vehicle Watchdog",    icon: Bike,       roleBlocked: undefined,     roleRequired: undefined   },
  { id: "property-engine",    label: "Guntur / Gorantla",   icon: Building,   roleBlocked: undefined,     roleRequired: undefined   },
  { id: "enhanced-rentals",   label: "Rentals",             icon: Home,       roleBlocked: undefined,     roleRequired: undefined   },
  { id: "insurance",          label: "Insurance",           icon: Shield,     roleBlocked: "BROTHER" as const, roleRequired: undefined },
  { id: "gold",               label: "Gold",                icon: Coins,      roleBlocked: "BROTHER" as const, roleRequired: undefined },
  { id: "cfa-recommendations",label: "CFA Insights",        icon: Brain,      roleBlocked: undefined,     roleRequired: undefined   },
  { id: "recommendations",    label: "Smart Insights",      icon: Sparkles,   roleBlocked: undefined,     roleRequired: undefined   },
  { id: "smart-goals",        label: "Smart Goals",         icon: Target,     roleBlocked: undefined,     roleRequired: undefined   },
  { id: "settings",           label: "Settings",            icon: Settings,   roleBlocked: undefined,     roleRequired: undefined   },
] as const;

function isModuleVisible(mod: typeof moreModules[number], role: string) {
  if (mod.roleRequired && role !== "ADMIN" && role !== mod.roleRequired) return false;
  if (mod.roleBlocked && role === mod.roleBlocked) return false;
  return true;
}

export function DesktopSidebar({ activeTab, onTabChange, activeMoreModule, onMoreNavigation }: Props) {
  const [moreOpen, setMoreOpen] = React.useState(true);
  const role = useRole();
  const visibleModules = moreModules.filter((m) => isModuleVisible(m, role));

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-border/40 bg-card/40 overflow-y-auto"
      style={{ height: "calc(100vh - 3.5rem)" /* 56px header */, position: "sticky", top: "3.5rem" }}
    >
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {/* ── Primary tabs ── */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
          Main
        </p>
        {mainNav.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              aria-current={active ? "page" : undefined}
              aria-label={`Navigate to ${label}`}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-left",
                "transition-all duration-150 focus-ring",
                active
                  ? "nav-pill-active text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "scale-110")} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
              {label}
            </button>
          );
        })}

        {/* ── More modules collapsible ── */}
        <div className="mt-3">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-ring"
          >
            <span>More</span>
            {moreOpen
              ? <ChevronDown className="h-3 w-3" aria-hidden="true" />
              : <ChevronRight className="h-3 w-3" aria-hidden="true" />
            }
          </button>

          {moreOpen && (
            <div className="flex flex-col gap-0.5 mt-1">
              {visibleModules.map(({ id, label, icon: Icon }) => {
                const active = activeMoreModule === id;
                return (
                  <button
                    key={id}
                    onClick={() => onMoreNavigation(id)}
                    aria-current={active ? "page" : undefined}
                    aria-label={`Navigate to ${label}`}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-left",
                      "transition-all duration-150 focus-ring",
                      active
                        ? "nav-pill-active text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", active && "scale-110")} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
