
import React from 'react';
import { Logger } from '@/services/logger';
import type { NavigationTab, MoreModule } from '@/types/common';

interface NavigationState {
  activeTab: NavigationTab;
  activeMoreModule: MoreModule;
}

export function useNavigationRouter() {
  const [navigationState, setNavigationState] = React.useState<NavigationState>({
    activeTab: 'dashboard',
    activeMoreModule: null
  });

  const handleTabChange = React.useCallback((tab: NavigationTab) => {
    try {
      Logger.debug('Navigation tab change:', { from: navigationState.activeTab, to: tab });
      setNavigationState(prev => ({
        activeTab: tab,
        activeMoreModule: tab !== 'more' ? null : prev.activeMoreModule
      }));
    } catch (error) {
      Logger.error('Error in tab change:', error);
      // Fallback to dashboard on error
      setNavigationState({
        activeTab: 'dashboard',
        activeMoreModule: null
      });
    }
  }, [navigationState.activeTab]);

  const handleMoreNavigation = React.useCallback((moduleId: string) => {
    try {
      Logger.debug('More navigation:', { moduleId });
      
      // Validate moduleId is a valid MoreModule
      const validModules: MoreModule[] = [
        'emergency-fund', 'rentals', 'recommendations', 'cfa-recommendations', 'cashflow', 
        'telegram', 'credit-cards', 'credit-card-statements', 'recurring-transactions', 
        'vehicles', 'insurance', 'health-tracker', 'subscriptions', 'family-banking'
      ];
      
      const validModuleId = validModules.includes(moduleId as MoreModule) ? moduleId as MoreModule : null;
      
      setNavigationState({
        activeTab: 'more',
        activeMoreModule: validModuleId
      });
    } catch (error) {
      Logger.error('Error in more navigation:', error);
      // Fallback to more screen without module
      setNavigationState({
        activeTab: 'more',
        activeMoreModule: null
      });
    }
  }, []);

  const goBack = React.useCallback(() => {
    try {
      setNavigationState(prev => ({
        activeTab: prev.activeMoreModule ? 'more' : 'dashboard',
        activeMoreModule: null
      }));
    } catch (error) {
      Logger.error('Error in go back:', error);
      // Fallback to dashboard
      setNavigationState({
        activeTab: 'dashboard',
        activeMoreModule: null
      });
    }
  }, []);

  return {
    ...navigationState,
    handleTabChange,
    handleMoreNavigation,
    goBack
  };
}
