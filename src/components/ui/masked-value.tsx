/**
 * MaskedValue — renders a financial amount based on RBAC role permissions.
 * Shows 🔒 ••••• blur when role lacks permission, real value when permitted.
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { useRole, usePermissions } from '@/store/rbacStore';

type PermissionKey = 'showSalary' | 'showInvestments' | 'showBrotherUS' | 'showHyderabadHealth' | 'showGorantlaRentals' | 'showGunturWaterfall';

interface MaskedValueProps {
  /** The value to potentially reveal */
  value: React.ReactNode;
  /** Which permission gate to check */
  permission?: PermissionKey;
  /** If true, always mask regardless of role (used for global privacy toggle) */
  forceHide?: boolean;
  /** CSS class name for the wrapper */
  className?: string;
  /** Placeholder shown when masked */
  placeholder?: string;
}

export function MaskedValue({
  value,
  permission,
  forceHide = false,
  className = '',
  placeholder = '••••••',
}: MaskedValueProps) {
  const permissions = usePermissions();
  const role = useRole();

  const isRevealed =
    !forceHide &&
    (role !== 'GUEST') &&
    (!permission || permissions[permission]);

  if (isRevealed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-muted-foreground select-none ${className}`}
      aria-label="Value masked — enter passphrase to reveal"
    >
      <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="blur-[4px] pointer-events-none">{placeholder}</span>
    </span>
  );
}

/** Convenience wrapper for currency amounts */
interface MaskedAmountProps {
  amount: number;
  permission?: PermissionKey;
  forceHide?: boolean;
  className?: string;
  prefix?: string;
}

export function MaskedAmount({
  amount,
  permission,
  forceHide = false,
  className = '',
  prefix = '₹',
}: MaskedAmountProps) {
  const formatted = `${prefix}${amount.toLocaleString('en-IN')}`;
  return (
    <MaskedValue
      value={formatted}
      permission={permission}
      forceHide={forceHide}
      className={className}
      placeholder={`${prefix}••••••`}
    />
  );
}
