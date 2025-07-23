
import React from 'react';
import { Button } from '@/components/ui/button';
import { seed } from '@/lib/seed';

export function SeedToggle() {
  const handleSeed = async () => {
    try {
      await seed();
      console.log('Seed loaded');
    } catch (error) {
      console.error('Seed error:', error);
    }
  };

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Button
      onClick={handleSeed}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white hover:bg-blue-700"
    >
      Seed
    </Button>
  );
}
