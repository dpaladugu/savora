
import { useState, useCallback } from 'react';

export type NavigationTab = 'dashboard' | 'expenses' | 'credit-cards' | 'investments' | 'goals' | 'upload' | 'settings' | 'more';

export type MoreModule = 
  | 'emergency-fund' 
  | 'rentals' 
  | 'recommendations' 
  | 'cashflow' 
  | 'telegram'
  | 'credit-cards'
  | 'credit-card-statements'
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
    console.log('Navigation tab change:', { from: navigationState.activeTab, to: tab });
    setNavigationState(prev => ({
      activeTab: tab,
      activeMoreModule: tab !== 'more' ? null : prev.activeMoreModule
    }));
  }, [navigationState.activeTab]);

  const handleMoreNavigation = useCallback((moduleId: string) => {
    console.log('More navigation:', { moduleId });
    setNavigationState({
      activeTab: 'more',
      activeMoreModule: moduleId as MoreModule
    });
  }, []);

  const goBack = useCallback(() => {
    setNavigationState(prev => ({
      activeTab: prev.activeMoreModule ? 'more' : 'dashboard',
      activeMoreModule: null
    }));
  }, []);

  return {
    ...navigationState,
    handleTabChange,
    handleMoreNavigation,
    goBack
  };
}
