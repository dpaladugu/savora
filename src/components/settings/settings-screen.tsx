import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Settings, User, Palette, Database, LogOut, Shield, FileJson, BrainCircuit } from "lucide-react"; // Added FileJson, BrainCircuit
import { useState } from "react";
import { Logger } from "@/services/logger";
import { DataImport } from "./DataImport"; // Import DataImport component
import { LLMSettingsForm } from "./llm-settings-form"; // Import LLMSettingsForm

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      Logger.info('User signing out', { userId: user?.uid });
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out of Savora.",
      });
    } catch (error) {
      Logger.error('Sign out error', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please sign in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <User className="w-5 h-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {user.email || 'No email provided'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                User ID
              </label>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md font-mono">
                {user.uid}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-primary" />
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
              <BrainCircuit className="w-5 h-5 text-primary" />
              LLM Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LLMSettingsForm />
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
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
              <Shield className="w-5 h-5 text-primary" />
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

        {/* Sign Out */}
        <Card className="metric-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground mb-1">Sign Out</h4>
                <p className="text-sm text-muted-foreground">
                  Sign out of your Savora account
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
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
