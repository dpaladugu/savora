
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
  
  // Add debugging for Router context
  let navigate;
  try {
    navigate = useNavigate();
    console.log('WelcomeScreen: useNavigate hook called successfully', typeof navigate);
  } catch (error) {
    console.error('WelcomeScreen: useNavigate hook failed:', error);
    console.error('WelcomeScreen: This suggests Router context is not available');
  }

  const handleCreateAccount = () => {
    console.log('WelcomeScreen: handleCreateAccount triggered');
    try {
      if (navigate) {
        navigate("/auth");
        onComplete();
      } else {
        console.error('WelcomeScreen: navigate function not available');
      }
    } catch (error) {
      console.error('WelcomeScreen: Error during navigation:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Savora</CardTitle>
          <CardDescription>
            Let's create your new account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateAccount} className="w-full">
            Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
