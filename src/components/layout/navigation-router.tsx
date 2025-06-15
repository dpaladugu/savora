
import { useState, useCallback } from 'react';

export type NavigationTab = 'dashboard' | 'expenses' | 'credit-cards' | 'investments' | 'goals' | 'upload' | 'settings' | 'more';

export type MoreModule = 
  | 'emergency-fund' 
  | 'rentals' 
  | 'recommendations' 
  | 'cashflow' 
  | 'telegram'
  | null;

interface NavigationState {
  activeTab: NavigationTab;
  activeMoreModule: MoreModule;
}

export function useNavigationRouter() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeTab: 'dashboard',
    activeMoreModule: null
  });

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setNavigationState(prev => ({
      activeTab: tab,
      activeMoreModule: tab !== 'more' ? null : prev.activeMoreModule
    }));
  }, []);

  const handleMoreNavigation = useCallback((moduleId: string) => {
    setNavigationState({
      activeTab: 'more',
      activeMoreModule: moduleId as MoreModule
    });
  }, []);

  return {
    ...navigationState,
    handleTabChange,
    handleMoreNavigation
  };
}
