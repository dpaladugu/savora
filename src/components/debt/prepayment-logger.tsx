/**
 * PrepaymentLogger — log a real-world prepayment against InCred or ICICI.
 * Reduces loan.outstanding in db.loans → all live queries auto-recalculate.
 */

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, CheckCircle2, IndianRupee, History,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const INCRED_MIN = 25_000;

interface PrepaymentRecord {
  id: string;
  loanId: string;
  loanName: string;
  amount: number;
  date: Date;
  note?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrepaymentLogger({ open, onClose }: Props) {
  const loans = useLiveQuery(() => db.loans.toArray(), []);
  const history = useLiveQuery<PrepaymentRecord[]>(
    () => db.appSettings.get('prepaymentHistory').then(r => (r?.value as PrepaymentRecord[]) ?? []),
    []
  );

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const activeLoans = (loans ?? []).filter(l => l.isActive !== false && (l.outstanding ?? l.principal) > 0);

  // Auto-select InCred as default target
  const defaultLoan = activeLoans.find(l => l.id === 'loan-incred-2026')
    ?? activeLoans.find(l => (l.roi ?? 0) >= 14);

  const effectiveLoanId = selectedLoanId || defaultLoan?.id || '';
  const selectedLoan = activeLoans.find(l => l.id === effectiveLoanId);
  const outstanding = selectedLoan ? (selectedLoan.outstanding ?? selectedLoan.principal) : 0;
  const amt = parseFloat(amount) || 0;
  const isIncred = selectedLoan?.id === 'loan-incred-2026' || (selectedLoan?.roi ?? 0) >= 14;
  const belowMinimum = isIncred && amt > 0 && amt < INCRED_MIN;
  const exceedsOutstanding = amt > outstanding;
  const canSave = amt > 0 && effectiveLoanId && !exceedsOutstanding && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const loan = await db.loans.get(effectiveLoanId);
      if (!loan) throw new Error('Loan not found');

      const currentOutstanding = loan.outstanding ?? loan.principal;
      const newOutstanding = Math.max(0, currentOutstanding - amt);

      await db.loans.update(effectiveLoanId, {
        outstanding: newOutstanding,
        isActive: newOutstanding > 0,
        updatedAt: new Date(),
      });

      // Save to prepayment history
      const prev: PrepaymentRecord[] = history ?? [];
      const record: PrepaymentRecord = {
        id: crypto.randomUUID(),
        loanId: effectiveLoanId,
        loanName: loan.name ?? 'Loan',
        amount: amt,
        date: new Date(date),
        note: note || undefined,
      };
      await db.appSettings.put({
        key: 'prepaymentHistory',
        value: [record, ...prev].slice(0, 20), // keep last 20
      });

      toast.success(
        `₹${amt.toLocaleString('en-IN')} prepayment logged for ${loan.name}. New outstanding: ${formatCurrency(newOutstanding)}`
      );
      setAmount('');
      setNote('');
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to log prepayment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <IndianRupee className="h-4 w-4 text-primary" />
            Log Prepayment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Loan selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Target Loan</Label>
            <div className="flex gap-2">
              {activeLoans.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLoanId(l.id)}
                  className={`flex-1 p-2.5 rounded-xl border text-xs text-left transition-colors ${
                    (effectiveLoanId === l.id)
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <p className="font-semibold truncate">{l.name}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{l.roi}% · {formatCurrency(l.outstanding ?? l.principal)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={isIncred ? 'Min ₹25,000 for InCred' : 'Enter amount'}
              className={belowMinimum || exceedsOutstanding ? 'border-destructive' : ''}
            />
            {belowMinimum && (
              <p className="text-[11px] text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                InCred requires minimum ₹25,000 per part-payment
              </p>
            )}
            {exceedsOutstanding && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Amount exceeds outstanding ({formatCurrency(outstanding)})
              </p>
            )}
            {amt > 0 && !belowMinimum && !exceedsOutstanding && (
              <p className="text-[11px] text-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                New outstanding: {formatCurrency(outstanding - amt)}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. March salary surplus"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave} className="flex-1">
              {saving ? 'Logging…' : 'Log Prepayment'}
            </Button>
          </div>

          {/* History */}
          {(history ?? []).length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <History className="h-3 w-3" /> Recent Prepayments
                </p>
                {(history ?? []).slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                    <div>
                      <p className="font-medium">{r.loanName}</p>
                      <p className="text-muted-foreground">{format(new Date(r.date), 'dd MMM yyyy')}{r.note ? ` · ${r.note}` : ''}</p>
                    </div>
                    <Badge variant="outline" className="text-success border-success/40 tabular-nums">
                      −{formatCurrency(r.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
