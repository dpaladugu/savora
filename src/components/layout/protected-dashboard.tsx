
import React, { useState, useEffect } from 'react';
import { useNavigationRouter } from './navigation-router';
import { MainContentRouter } from './main-content-router';
import { PersistentNavigation } from './persistent-navigation';
import { GlobalHeader } from './global-header';
import { useIsAuthenticated, usePrivacyMask } from '@/store/appStore';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PrivacyMask } from '@/components/auth/PrivacyMask';

export function ProtectedDashboard() {
  const navigation = useNavigationRouter();
  const isAuthenticated = useIsAuthenticated();
  const privacyMask = usePrivacyMask();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Savora...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <GlobalHeader title="Savora" />
        
        <div className="flex flex-col lg:flex-row">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full lg:top-16 lg:left-0 border-r border-border bg-card">
            <PersistentNavigation
              activeTab={navigation.activeTab}
              activeMoreModule={navigation.activeMoreModule}
              onTabChange={navigation.handleTabChange}
              onMoreNavigation={navigation.handleMoreNavigation}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 lg:ml-64 lg:pt-16">
            {privacyMask ? (
              <div className="relative">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Privacy mode is active</p>
                    <PrivacyMask amount={0} />
                  </div>
                </div>
                <MainContentRouter
                  activeTab={navigation.activeTab}
                  activeMoreModule={navigation.activeMoreModule}
                  onMoreNavigation={navigation.handleMoreNavigation}
                  onTabChange={navigation.handleTabChange}
                />
              </div>
            ) : (
              <MainContentRouter
                activeTab={navigation.activeTab}
                activeMoreModule={navigation.activeMoreModule}
                onMoreNavigation={navigation.handleMoreNavigation}
                onTabChange={navigation.handleTabChange}
              />
            )}
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card">
            <PersistentNavigation
              activeTab={navigation.activeTab}
              activeMoreModule={navigation.activeMoreModule}
              onTabChange={navigation.handleTabChange}
              onMoreNavigation={navigation.handleMoreNavigation}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
