import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';

interface PinEntryModalProps {
  isOpen: boolean;
  onClose: ()   => void;
  onSubmit: (pin: string) => Promise<void>; // Make onSubmit async to handle potential errors
  title?: string;
  description?: string;
}

export function PinEntryModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Enter PIN",
  description = "Please enter your application PIN to proceed."
}: PinEntryModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(pin);
      // If onSubmit is successful, parent component should close modal
      // onClose(); // Or let parent handle close on successful submit
    } catch (submissionError: any) {
      setError(submissionError.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
      // Do not clear PIN here, user might want to retry or it might be closed by parent
    }
  };

  // Reset state when dialog is closed externally or on successful submit (if parent closes)
  // This is better handled if the parent controls clearing pin on successful submit/close.
  // For now, we reset when it opens, assuming it's for a new operation.
  React.useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="pin-entry-description">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription id="pin-entry-description">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pin-modal-input" className="text-right col-span-1">
                PIN
              </Label>
              <Input
                id="pin-modal-input"
                type="password"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Enter PIN (4-6 digits)"
                maxLength={6}
                className="col-span-3 text-center tracking-[0.2em] font-mono"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive text-center col-span-4">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || pin.length < 4}>
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
