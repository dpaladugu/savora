import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Settings, User, Palette, Database, LogOut, Shield, FileJson, BrainCircuit, Tag as TagIcon } from "lucide-react"; // Added TagIcon
import { useState } from "react";
import { Logger } from "@/services/logger";
import { DataImport } from "./DataImport";
import { LLMSettingsForm } from "./llm-settings-form";
import { TagManager } from "@/components/tags/TagManager"; // Import TagManager

export function SettingsScreen() {
  const { toast } = useToast();

  return (
    // Removed min-h-screen, bg-gradient, pb-24, pt-16, px-4.
    // These are expected to be handled by the parent router using ModuleHeader.
    // Also removed the inline H1/P title section.
    <> {/* Wrapping in a fragment */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* User Profile */}
      <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User aria-hidden="true" className="w-5 h-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is a local-only version of the application. There is no account to manage.
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Palette aria-hidden="true" className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Theme</h4>
                <p className="text-sm text-muted-foreground">
                  Use the toggle in the top-right corner to switch between light and dark modes
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Currency</h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">₹</span>
                  <span className="text-foreground">Indian Rupee (INR)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LLM Configuration */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BrainCircuit aria-hidden="true" className="w-5 h-5 text-primary" />
              LLM Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LLMSettingsForm />
          </CardContent>
        </Card>

        {/* Tag Management */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TagIcon aria-hidden="true" className="w-5 h-5 text-primary" />
              Manage Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagManager />
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database aria-hidden="true" className="w-5 h-5 text-primary" />
              Data & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Data Storage</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your financial data is securely stored in Firebase and synced across devices
              </p>
              <Button variant="outline" disabled>
                Export Data (Coming Soon)
              </Button>
            </div>
            <div className="mt-6"> {/* Added margin for separation */}
              <DataImport />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Offline Access</h4>
              <p className="text-sm text-muted-foreground">
                Savora works offline with automatic sync when you're back online
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield aria-hidden="true" className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Data Privacy</h4>
              <p className="text-sm text-muted-foreground">
                All your financial data is private and encrypted. Only you can access your information.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Local PIN</h4>
              <Button variant="outline" className="btn-primary">
                Setup PIN (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>


        <div className="text-center text-sm text-muted-foreground">
          Savora v1.0.0 - Built for comprehensive personal finance tracking
        </div>
      {/* Removed extra closing </div> tag that was here */}
      </motion.div>
    </> // Closing fragment
  );
}
