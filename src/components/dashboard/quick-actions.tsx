
import React from 'react';
import { NavigationTab } from '@/types/common';
import {
  Plus, Banknote, Droplets, Crosshair, TrendingUp, BarChart3,
} from 'lucide-react';

interface QuickActionsProps {
  onTabChange: (tab: NavigationTab) => void;
  onMoreNavigation: (moduleId: string) => void;
  onAddIncome?: () => void;
  onPrepay?: () => void;
}

const TILES = [
  { id: 'add-expense',  label: 'Add Expense',  icon: Plus,       color: 'bg-destructive/10 text-destructive', tab: 'expenses'  as NavigationTab },
  { id: 'add-income',   label: 'Income',       icon: Banknote,   color: 'bg-success/10 text-success',         tab: null, special: 'income' },
  { id: 'waterfall',    label: 'Waterfall',    icon: Droplets,   color: 'bg-primary/10 text-primary',         module: 'property-engine' },
  { id: 'debt-strike',  label: 'Debt Strike',  icon: Crosshair,  color: 'bg-warning/10 text-warning',         module: 'debt-strike' },
  { id: 'investments',  label: 'Invest',       icon: TrendingUp, color: 'bg-accent/10 text-accent',           tab: 'investments' as NavigationTab },
  { id: 'budget',       label: 'Budget',       icon: BarChart3,  color: 'bg-muted text-muted-foreground',     module: 'budget-vs-actual' },
] as const;

export function QuickActions({ onTabChange, onMoreNavigation, onAddIncome, onPrepay }: QuickActionsProps) {
  const handleTile = (tile: typeof TILES[number]) => {
    if ('special' in tile && tile.special === 'income') { onAddIncome?.(); return; }
    if ('tab' in tile && tile.tab)    { onTabChange(tile.tab); return; }
    if ('module' in tile && tile.module) { onMoreNavigation(tile.module); return; }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {TILES.map(tile => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.id}
            onClick={() => handleTile(tile)}
            className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/30 active:scale-[0.97] transition-all"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{tile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
