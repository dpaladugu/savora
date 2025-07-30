
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  console.log('WelcomeScreen: Component mounting');
  console.log('WelcomeScreen: React version check:', typeof React, React);
  
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    console.log('WelcomeScreen: handleCreateAccount triggered');
    try {
      navigate("/auth");
    } catch (error) {
      console.error('WelcomeScreen: Error during navigation:', error);
    }
  };

  const handleSkipForNow = () => {
    console.log('WelcomeScreen: handleSkipForNow triggered');
    // For demo purposes, let's allow users to skip auth and go directly to the app
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Savora</CardTitle>
          <CardDescription>
            Your personal finance management companion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreateAccount} className="w-full">
            Create Account
          </Button>
          <Button onClick={handleSkipForNow} variant="outline" className="w-full">
            Skip for Now (Demo Mode)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
