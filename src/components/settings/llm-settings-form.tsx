
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
import { Brain, Key, Settings, TestTube, Lightbulb } from 'lucide-react';
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

export function LLMSettingsForm() {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.openai.com/v1'
  });
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await LLMPromptService.getLLMConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      toast.error('Failed to load LLM configuration');
      console.error('Error loading LLM config:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await LLMPromptService.updateLLMConfig(config);
      toast.success('LLM configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save LLM configuration');
      console.error('Error saving LLM config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPrompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }

    try {
      setTesting(true);
      // Test with expense categorization prompt
      const result = await LLMPromptService.executePrompt('expense-categorization', {
        description: testPrompt,
        amount: '500',
        categories: 'Food, Transport, Entertainment, Shopping'
      });
      setTestResult(result);
      toast.success('Test completed successfully');
    } catch (error) {
      toast.error('Test failed. Please check your configuration.');
      console.error('Error testing LLM:', error);
    } finally {
      setTesting(false);
    }
  };

  const promptTemplates = LLMPromptService.getPromptTemplates();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prompt Templates
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test & Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                LLM Provider Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Configure your preferred AI provider for intelligent expense analysis, investment advice, and financial insights.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={config.provider} onValueChange={(value: any) => setConfig({...config, provider: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="gemini">Google (Gemini)</SelectItem>
                      <SelectItem value="local">Local Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={config.model} onValueChange={(value) => setConfig({...config, model: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.provider === 'openai' && (
                        <>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </>
                      )}
                      {config.provider === 'anthropic' && (
                        <>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        </>
                      )}
                      {config.provider === 'gemini' && (
                        <>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <Label htmlFor="baseUrl">Base URL (Optional)</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl || ''}
                  onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                  placeholder="Custom API endpoint URL"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Temperature: {config.temperature}</Label>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([value]) => setConfig({...config, temperature: value})}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls randomness. Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div>
                  <Label>Max Tokens: {config.maxTokens}</Label>
                  <Slider
                    value={[config.maxTokens]}
                    onValueChange={([value]) => setConfig({...config, maxTokens: value})}
                    max={4000}
                    min={100}
                    step={100}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum response length
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>Available Prompt Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promptTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div className="mt-3">
                      <Label>Variables:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testPrompt">Test Prompt</Label>
                <Textarea
                  id="testPrompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a test expense description (e.g., 'Dinner at restaurant')"
                  rows={3}
                />
              </div>

              <Button onClick={handleTest} disabled={testing} className="w-full">
                {testing ? 'Testing...' : 'Test Configuration'}
              </Button>

              {testResult && (
                <div>
                  <Label>Test Result:</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
