
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  console.log('WelcomeScreen: Component mounting');
  
  const navigate = useNavigate();
  console.log('WelcomeScreen: useNavigate hook called successfully');

  const handleCreateAccount = () => {
    console.log('WelcomeScreen: handleCreateAccount triggered');
    navigate("/auth");
    onComplete();
  };

  return React.createElement(
    "div",
    { className: "flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900" },
    React.createElement(
      Card,
      { className: "w-full max-w-md mx-4" },
      React.createElement(
        CardHeader,
        { className: "text-center" },
        React.createElement(CardTitle, { className: "text-2xl font-bold" }, "Welcome to Savora"),
        React.createElement(
          CardDescription,
          null,
          "Let's create your new account to get started."
        )
      ),
      React.createElement(
        CardContent,
        null,
        React.createElement(Button, { onClick: handleCreateAccount, className: "w-full" }, "Create Account")
      )
    )
  );
}
