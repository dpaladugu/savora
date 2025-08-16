
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Sparkles } from 'lucide-react';

export function FeatureCompleteBanner() {
  return (
    <Alert className="border-green-200 bg-green-50 mb-6">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">Phase 2 Complete!</span>
        All core financial management UI components are now fully functional with CRUD operations, performance tracking, and smart alerts.
      </AlertDescription>
    </Alert>
  );
}
