
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate("/auth");
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Savora</CardTitle>
          <CardDescription>
            Let’s create your new account to get started.
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
