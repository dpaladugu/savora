
import * as React from 'react';
import { toast } from 'sonner';

export const DbErrorListener = () => {
  React.useEffect(() => {
    const handleDbError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const error = customEvent.detail;

      console.error('Database Error:', error);

      if (error.name === 'UpgradeError') {
        toast.error('Database Upgrade Needed', {
          description: 'The app database needs an upgrade. Please clear your browser data for this site and refresh the page.',
          duration: Infinity,
        });
      } else {
        toast.error('Database Error', {
          description: 'A database error occurred. Please try refreshing the page.',
          duration: 10000,
        });
      }
    };

    window.addEventListener('db-error', handleDbError);

    return () => {
      window.removeEventListener('db-error', handleDbError);
    };
  }, []);

  return null;
};
