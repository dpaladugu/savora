
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSettingsManager } from './global-settings-manager';
import { LLMSettingsForm } from './llm-settings-form';
import { ComprehensiveSettingsScreen } from './comprehensive-settings-screen';
import { BackupRestore } from './backup-restore';
import { BackupNudge } from './backup-nudge';
import { Settings, Brain, Shield, User, Database, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinancialSetupWizard } from '@/components/setup/financial-setup-wizard';

const tabs = [
  { value: 'user',   label: 'User',   icon: User     },
  { value: 'global', label: 'Global', icon: Shield   },
  { value: 'ai',     label: 'AI',     icon: Brain    },
  { value: 'data',   label: 'Data',   icon: Database },
] as const;

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('user');
  return (
    <div className="w-full">
      {/* ── Page title ── */}
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Preferences, security and AI configuration
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/*
          4 tabs at top-level. Use a 4-column grid so they never scroll or overlap.
          Each cell is equal-width. On 320px SE: 4×~72px = fine.
        */}
        <TabsList
          className="grid grid-cols-4 w-full rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto gap-0.5"
          aria-label="Settings sections"
        >
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              role="tab"
              className="
                tab-trigger flex items-center justify-center gap-1.5
                py-2 px-1 rounded-xl text-xs font-semibold
                whitespace-nowrap
                data-[state=active]:bg-background data-[state=active]:shadow-sm
                data-[state=active]:text-primary
                text-muted-foreground
                transition-all duration-150
              "
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {/* Hide text on very small screens, show icon only */}
              <span className="hidden xs:inline sm:inline">{label}</span>
              {/* Always show label from 360px+ */}
              <span className="xs:hidden">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="user">
          <ComprehensiveSettingsScreen />
        </TabsContent>

        <TabsContent value="global">
          <GlobalSettingsManager />
        </TabsContent>

        <TabsContent value="ai">
          <LLMSettingsForm />
        </TabsContent>

        <TabsContent value="data">
          <BackupNudge onGoToBackup={() => setActiveTab('data')} />
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </div>
  );
}
