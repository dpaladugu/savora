
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, Key, Settings, TestTube } from 'lucide-react';
import { LLMPromptService } from '@/services/LLMPromptService';
import { toast } from 'sonner';

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

const aiTabs = [
  { value: 'config',   label: 'Config',   icon: Settings  },
  { value: 'api',      label: 'API Key',  icon: Key       },
  { value: 'test',     label: 'Test',     icon: TestTube  },
] as const;

export function LLMSettingsForm() {
  const [config, setConfig] = useState<LLMConfig>({ provider: 'openai', model: 'gpt-4', temperature: 0.7, maxTokens: 1000, baseUrl: 'https://api.openai.com/v1' });
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const saved = await LLMPromptService.getLLMConfig();
      if (saved) setConfig(saved);
    } catch {
      toast.error('Failed to load LLM config');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await LLMPromptService.updateLLMConfig(config);
      toast.success('LLM configuration saved');
    } catch {
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPrompt.trim()) { toast.error('Enter a test prompt'); return; }
    try {
      setTesting(true);
      setTestResult('Testing...');
      const result = await LLMPromptService.testLLMConfig(config, testPrompt);
      setTestResult(result || 'No response');
    } catch (e: any) {
      setTestResult('Error: ' + (e.message || 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold">AI / LLM Settings</h2>
          <p className="text-xs text-muted-foreground">Configure your AI provider for financial insights</p>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          <strong>Privacy:</strong> Your financial data is never sent to AI. You export an anonymised JSON prompt manually and import recommendations back.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="config" className="space-y-4">
        {/* 3-tab row — grid cols-3 is perfect here */}
        <TabsList className="grid grid-cols-3 w-full rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto gap-0.5">
          {aiTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              role="tab"
              className="
                tab-trigger flex items-center justify-center gap-1.5
                py-2 px-2 rounded-xl text-xs font-semibold
                data-[state=active]:bg-background data-[state=active]:shadow-sm
                data-[state=active]:text-primary text-muted-foreground
                transition-all duration-150
              "
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select value={config.provider} onValueChange={(v: any) => setConfig({ ...config, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="local">Local (Ollama)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} placeholder="gpt-4, claude-3-opus, gemini-pro..." />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature</Label>
                  <span className="text-xs font-medium text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider min={0} max={1} step={0.1} value={[config.temperature]} onValueChange={(v) => setConfig({ ...config, temperature: v[0] })} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input type="number" value={config.maxTokens} onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" value={config.apiKey || ''} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="sk-..." />
                <p className="text-xs text-muted-foreground">Stored encrypted in IndexedDB. Never leaves your device.</p>
              </div>
              {config.provider === 'local' && (
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input value={config.baseUrl || ''} onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })} placeholder="http://localhost:11434/v1" />
                </div>
              )}
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save API Key'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Test Prompt</Label>
                <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} placeholder="Ask a financial question..." rows={3} />
              </div>
              <Button onClick={handleTest} disabled={testing} className="w-full gap-2">
                <TestTube className="h-4 w-4" />
                {testing ? 'Testing...' : 'Run Test'}
              </Button>
              {testResult && (
                <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Response</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{testResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
