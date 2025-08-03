
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
}

interface ModalBodyProps {
  children: React.ReactNode;
}

interface ModalFooterProps {
  children: React.ReactNode;
}

interface ModalCloseButtonProps {
  onClick?: () => void;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  );
}

export function ModalHeader({ children }: ModalHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>{children}</DialogTitle>
    </DialogHeader>
  );
}

export function ModalBody({ children }: ModalBodyProps) {
  return (
    <div className="py-4">
      {children}
    </div>
  );
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <DialogFooter>
      {children}
    </DialogFooter>
  );
}

export function ModalCloseButton({ onClick }: ModalCloseButtonProps) {
  return (
    <Button variant="outline" onClick={onClick}>
      <X className="w-4 h-4 mr-2" />
      Close
    </Button>
  );
}
