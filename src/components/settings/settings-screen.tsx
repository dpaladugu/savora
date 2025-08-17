
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSettingsManager } from './global-settings-manager';
import { LLMSettingsForm } from './llm-settings-form';
import { ComprehensiveSettingsScreen } from './comprehensive-settings-screen';
import { Settings, Brain, Shield, User } from 'lucide-react';

export function SettingsScreen() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your app preferences, security, and AI settings
        </p>
      </div>

      <Tabs defaultValue="user" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Settings
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Configuration
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Data Management
          </TabsTrigger>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">Data management features coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
