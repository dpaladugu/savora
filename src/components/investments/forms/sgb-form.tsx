import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Investment } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Coins, X, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

const schema = z.object({
  name:             z.string().min(1, 'Label required'),
  sgbSeries:        z.string().optional(),
  sgbUnits:         z.coerce.number().nonneg(),   // grams
  sgbIssuePrice:    z.coerce.number().nonneg(),   // ₹/gram at issue
  currentPricePerG: z.coerce.number().nonneg(),   // current MCX price/gram
  sgbIssueDate:     z.string().optional(),
  sgbCouponAccount: z.string().default('SBI'),
  notes:            z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function SGBForm({ initial, onDone }: Props) {
  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || 'SGB',
      sgbSeries: initial?.sgbSeries || '',
      sgbUnits: initial?.sgbUnits || 0,
      sgbIssuePrice: initial?.sgbIssuePrice || 0,
      currentPricePerG: initial?.currentValue && initial?.sgbUnits
        ? initial.currentValue / initial.sgbUnits : 0,
      sgbIssueDate: initial?.sgbIssueDate?.toISOString().split('T')[0] || '',
      sgbCouponAccount: initial?.sgbCouponAccount || 'SBI',
      notes: initial?.notes || '',
    },
  });

  const units    = watch('sgbUnits')         || 0;
  const issue    = watch('sgbIssuePrice')    || 0;
  const current  = watch('currentPricePerG') || 0;
  const invested = units * issue;
  const currVal  = units * current;
  const annCoupon = currVal * 0.025;
  const issDate  = watch('sgbIssueDate');
  const matDate  = issDate ? (() => { const d = new Date(issDate); d.setFullYear(d.getFullYear() + 8); return d; })() : null;

  const onSubmit = async (data: F) => {
    const now = new Date();
    const maturityDate = data.sgbIssueDate ? (() => { const d = new Date(data.sgbIssueDate!); d.setFullYear(d.getFullYear() + 8); return d; })() : undefined;
    const record: Partial<Investment> = {
      name: data.name, type: 'SGB',
      sgbSeries: data.sgbSeries, sgbUnits: data.sgbUnits,
      sgbIssuePrice: data.sgbIssuePrice,
      sgbIssueDate: data.sgbIssueDate ? new Date(data.sgbIssueDate) : undefined,
      sgbMaturityDate: maturityDate,
      maturityDate,
      sgbCouponRate: 2.5,
      sgbCouponAccount: data.sgbCouponAccount,
      investedValue: invested, currentValue: currVal,
      currentNav: data.currentPricePerG, units: data.sgbUnits,
      taxBenefit: true, familyMember: 'Me',
      notes: data.notes, frequency: 'One-time', updatedAt: now,
    };
    if (initial?.id) { await db.investments.update(initial.id, record); toast.success('Updated'); }
    else { await db.investments.add({ ...record, id: crypto.randomUUID(), createdAt: now } as Investment); toast.success('Added'); }
    onDone();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 text-warning" />{initial ? 'Edit' : 'Add'} Sovereign Gold Bond
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Live calc banner */}
          {units > 0 && current > 0 && (
            <div className="p-3 rounded-xl border border-warning/20 bg-warning/5 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Invested</span><span className="font-bold">{formatCurrency(invested)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Current value</span><span className="font-bold">{formatCurrency(currVal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Annual coupon (2.5%) → {watch('sgbCouponAccount')}</span><span className="font-bold text-warning">{formatCurrency(annCoupon)}</span></div>
              {matDate && <div className="flex justify-between"><span className="text-muted-foreground">Maturity</span><span className="font-bold">{matDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="SGB 2022-23 Series VI" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Series</Label>
              <Input placeholder="SGB 2022-23 Series VI" {...register('sgbSeries')} />
            </div>
            <div className="space-y-1.5">
              <Label>Units (grams)</Label>
              <Input type="number" step="1" placeholder="10" {...register('sgbUnits')} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue Price (₹/gram)</Label>
              <Input type="number" step="1" placeholder="5900" {...register('sgbIssuePrice')} />
            </div>
            <div className="space-y-1.5">
              <Label>Current Gold Price (₹/gram)</Label>
              <Input type="number" step="1" placeholder="7500" {...register('currentPricePerG')} />
              <p className="text-[10px] text-muted-foreground">MCX 24K spot</p>
            </div>
            <div className="space-y-1.5">
              <Label>Coupon Credited to</Label>
              <Input placeholder="SBI" {...register('sgbCouponAccount')} />
              <p className="text-[10px] text-muted-foreground">Bank account where 2.5% interest goes</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Issue Date</Label>
              <Input type="date" {...register('sgbIssueDate')} />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />Maturity = Issue date + 8 years (pre-exit from year 5)
              </p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Certificate no., DMAT holding, etc." {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving…' : initial ? 'Update' : 'Add SGB'}</Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
