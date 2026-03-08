import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Investment } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Landmark, X, AlertCircle } from 'lucide-react';

const schema = z.object({
  name:          z.string().min(1, 'Label required'),
  npsTier:       z.enum(['T1', 'T2']),
  pran:          z.string().optional(),
  npsEquityPct:  z.coerce.number().min(0).max(75),
  npsCorpDebt:   z.coerce.number().min(0).max(100),
  npsGovDebt:    z.coerce.number().min(0).max(100),
  nps80CCDUsed:  z.coerce.number().nonneg().optional(),
  investedValue: z.coerce.number().nonneg(),
  currentValue:  z.coerce.number().nonneg(),
  notes:         z.string().optional(),
}).refine(d => d.npsEquityPct + d.npsCorpDebt + d.npsGovDebt === 100, {
  message: 'E + C + G allocation must sum to 100%',
  path: ['npsEquityPct'],
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function NPSForm({ initial, onDone }: Props) {
  const { register, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || 'My NPS T1',
      npsTier: initial?.npsTier || 'T1',
      pran: initial?.pran || '',
      npsEquityPct: initial?.npsEquityPct ?? 75,
      npsCorpDebt: initial?.npsCorpDebtPct ?? 15,
      npsGovDebt: initial?.npsGovDebtPct ?? 10,
      nps80CCDUsed: initial?.nps80CCDUsed,
      investedValue: initial?.investedValue || 0,
      currentValue: initial?.currentValue || 0,
      notes: initial?.notes || '',
    },
  });

  const tier         = watch('npsTier');
  const used80CCD    = watch('nps80CCDUsed') ?? 0;
  const usedPct      = Math.min(100, (used80CCD / 50000) * 100);
  const allocationSum = (watch('npsEquityPct') || 0) + (watch('npsCorpDebt') || 0) + (watch('npsGovDebt') || 0);

  const onSubmit = async (data: F) => {
    const now = new Date();
    const record: Partial<Investment> = {
      name: data.name, type: data.npsTier === 'T1' ? 'NPS-T1' : 'NPS-T2',
      npsTier: data.npsTier, pran: data.pran,
      npsEquityPct: data.npsEquityPct, npsCorpDebtPct: data.npsCorpDebt, npsGovDebtPct: data.npsGovDebt,
      nps80CCDUsed: data.nps80CCDUsed,
      investedValue: data.investedValue, currentValue: data.currentValue,
      currentNav: 0, units: 0, taxBenefit: true, familyMember: 'Me',
      notes: data.notes, frequency: 'Monthly', updatedAt: now,
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
            <Landmark className="h-4 w-4 text-primary" />{initial ? 'Edit' : 'Add'} NPS Account
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {tier === 'T1' && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold">80CCD(1B) Used this FY</p>
                <p className="text-xs font-bold text-primary tabular-nums">₹{used80CCD.toLocaleString('en-IN')} / ₹50,000</p>
              </div>
              <Progress value={usedPct} className={usedPct >= 100 ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'} />
              {usedPct >= 100 && <p className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />Limit exhausted</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="My NPS T1 – HDFC Pension" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tier</Label>
              <Select defaultValue={initial?.npsTier || 'T1'} onValueChange={v => setValue('npsTier', v as 'T1' | 'T2')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Tier 1 (80CCD eligible)</SelectItem>
                  <SelectItem value="T2">Tier 2 (no lock-in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PRAN</Label>
              <Input placeholder="110012345678" {...register('pran')} />
            </div>

            {/* Allocation */}
            <div className="col-span-2 p-3 rounded-xl bg-muted/40 space-y-2">
              <p className="text-xs font-semibold">Asset Allocation (E + C + G = 100%)</p>
              {allocationSum !== 100 && <p className="text-[10px] text-destructive">Currently sums to {allocationSum}%</p>}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Equity (E) %</Label>
                  <Input type="number" min="0" max="75" step="5" {...register('npsEquityPct')} />
                  <p className="text-[9px] text-muted-foreground">Max 75%</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Corp Debt (C) %</Label>
                  <Input type="number" min="0" max="100" step="5" {...register('npsCorpDebt')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Govt Sec (G) %</Label>
                  <Input type="number" min="0" max="100" step="5" {...register('npsGovDebt')} />
                </div>
              </div>
              {errors.npsEquityPct && <p className="text-xs text-destructive">{errors.npsEquityPct.message}</p>}
            </div>

            {tier === 'T1' && (
              <div className="space-y-1.5">
                <Label>80CCD(1B) Claimed This FY (₹)</Label>
                <Input type="number" step="1000" placeholder="50000" {...register('nps80CCDUsed')} />
                <p className="text-[10px] text-muted-foreground">Extra deduction, max ₹50,000</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Total Contributed (₹)</Label>
              <Input type="number" step="100" {...register('investedValue')} />
            </div>
            <div className={tier === 'T1' ? '' : 'col-span-2'}>
              <div className="space-y-1.5">
                <Label>Current Corpus (₹) — from CRA statement</Label>
                <Input type="number" step="100" {...register('currentValue')} />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Fund manager, PFM name, etc." {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving…' : initial ? 'Update' : 'Add NPS'}</Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
