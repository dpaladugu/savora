
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function Auth() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleSignIn = () => {
    // For demo purposes, simulate successful auth
    console.log('Auth: Simulating successful sign in');
    navigate('/');
  };

  const handleSignUp = () => {
    // For demo purposes, simulate successful signup
    console.log('Auth: Simulating successful sign up');
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div></div>
          </div>
          <CardTitle className="text-2xl font-bold">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 mb-4">
            Authentication functionality will be implemented later. For now, you can continue to the demo.
          </p>
          <Button onClick={handleSignIn} className="w-full">
            Sign In (Demo)
          </Button>
          <Button onClick={handleSignUp} variant="outline" className="w-full">
            Sign Up (Demo)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
