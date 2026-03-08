/**
 * BackupNudge — shows a dismissible banner in Settings when no backup in 30 days.
 */
import React, { useState, useEffect } from 'react';
import { Download, X, ShieldCheck } from 'lucide-react';
import { DataSafetyService } from '@/services/DataSafetyService';
import { Button } from '@/components/ui/button';

interface Props {
  onGoToBackup: () => void;
}

export function BackupNudge({ onGoToBackup }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('backup_nudge_dismissed') === '1';
    if (!wasDismissed && DataSafetyService.shouldNudgeBackup()) {
      setShow(true);
    }
  }, []);

  if (!show || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem('backup_nudge_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl border border-warning/40 bg-warning/5 mb-3">
      <ShieldCheck className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-warning">No backup in 30+ days</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Your data lives only in this browser. Export a backup to keep it safe.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 text-[10px] gap-1.5 rounded-xl border-warning/40 text-warning hover:bg-warning/10"
          onClick={onGoToBackup}
        >
          <Download className="h-3 w-3" /> Export Backup Now
        </Button>
      </div>
      <button
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-warning/10 transition-colors shrink-0"
        aria-label="Dismiss backup reminder"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
