import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Key, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/services/auth-service';

interface LLMSettings {
  apiKey: string;
  model: string;
  enabled: boolean;
}

const defaultSettings: LLMSettings = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  enabled: false,
};

export function LLMSettingsForm() {
  const [settings, setSettings] = useState<LLMSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem('llmSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      model: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      enabled: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('llmSettings', JSON.stringify(settings));
      toast.success('LLM settings saved successfully!');
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      toast.error('Failed to save LLM settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Settings</CardTitle>
        <CardDescription>Configure your Large Language Model settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="enabled">Enable LLM</Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          <Separator />
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              type="password"
              id="apiKey"
              name="apiKey"
              value={settings.apiKey}
              onChange={handleInputChange}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Select value={settings.model} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT 3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
