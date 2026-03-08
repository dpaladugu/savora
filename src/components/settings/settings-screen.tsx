
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSettingsManager } from './global-settings-manager';
import { LLMSettingsForm } from './llm-settings-form';
import { ComprehensiveSettingsScreen } from './comprehensive-settings-screen';
import { Settings, Brain, Shield, User, Database } from 'lucide-react';

const tabs = [
  { value: 'user',   label: 'User',    mobileLabel: 'User',    icon: User     },
  { value: 'global', label: 'Global',  mobileLabel: 'Global',  icon: Shield   },
  { value: 'ai',     label: 'AI',      mobileLabel: 'AI',      icon: Brain    },
  { value: 'data',   label: 'Data',    mobileLabel: 'Data',    icon: Database },
] as const;

export function SettingsScreen() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Page title ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Settings className="h-6 w-6 text-primary" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your app preferences, security, and AI settings
        </p>
      </div>

      <Tabs defaultValue="user" className="space-y-4">
        {/*
          ── Tab list ──
          Use a flex row with overflow-x-auto so it never wraps or overlaps.
          Each trigger shows icon + short label, flexes to equal width on wider screens.
        */}
        <TabsList
          className="flex w-full overflow-x-auto scrollbar-hide gap-1 rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto"
          aria-label="Settings sections"
        >
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="
                flex flex-1 min-w-[60px] items-center justify-center gap-1.5
                py-2.5 px-3 rounded-xl text-xs font-semibold
                whitespace-nowrap shrink-0
                data-[state=active]:bg-background data-[state=active]:shadow-sm
                data-[state=active]:text-primary
                text-muted-foreground
                transition-all duration-150
              "
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="user">
          {/* Strip the inner container padding — parent already handles it */}
          <ComprehensiveSettingsScreen />
        </TabsContent>

        <TabsContent value="global">
          <GlobalSettingsManager />
        </TabsContent>

        <TabsContent value="ai">
          <LLMSettingsForm />
        </TabsContent>

        <TabsContent value="data">
          <div className="text-center py-12">
            <Database className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Data management features coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
