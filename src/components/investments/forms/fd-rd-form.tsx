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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard as FDIcon, X } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

const schema = z.object({
  name:                z.string().min(1, 'Label required'),
  fdType:              z.enum(['FD', 'RD']),
  bankName:            z.string().min(1, 'Bank name required'),
  accountNumber:       z.string().optional(),
  fdPrincipal:         z.coerce.number().nonnegative(),
  fdRate:              z.coerce.number().nonnegative().max(20),
  fdTenureDays:        z.coerce.number().int().nonnegative().optional(),
  startDate:           z.string().optional(),
  fdMaturityAmount:    z.coerce.number().nonnegative().optional(),
  rdMonthlyInstalment: z.coerce.number().nonnegative().optional(),
  fdTdsApplicable:     z.boolean().default(true),
  fdAutoRenewal:       z.boolean().default(false),
  familyMember:        z.string().default('Me'),
  notes:               z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function FDRDForm({ initial, onDone }: Props) {
  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      fdType: (initial?.type === 'RD' ? 'RD' : 'FD') as 'FD' | 'RD',
      bankName: initial?.bankName ?? '',
      accountNumber: initial?.accountNumber ?? '',
      fdPrincipal: initial?.fdPrincipal ?? initial?.investedValue ?? 0,
      fdRate: initial?.fdRate ?? 0,
      fdTenureDays: initial?.fdTenureDays ?? undefined,
      startDate: initial?.startDate ? new Date(initial.startDate).toISOString().split('T')[0] : '',
      fdMaturityAmount: initial?.fdMaturityAmount ?? undefined,
      rdMonthlyInstalment: initial?.rdMonthlyInstalment ?? undefined,
      fdTdsApplicable: initial?.fdTdsApplicable ?? true,
      fdAutoRenewal: initial?.fdAutoRenewal ?? false,
      familyMember: initial?.familyMember ?? 'Me',
      notes: initial?.notes ?? '',
    },
  });

  const fdType    = watch('fdType');
  const principal = Number(watch('fdPrincipal') ?? 0);
  const rate      = Number(watch('fdRate')      ?? 0);
  const tenure    = Number(watch('fdTenureDays') ?? 0);
  const startStr  = watch('startDate');

  // Quarterly compounding approximation
  const calcMaturity = principal > 0 && rate > 0 && tenure > 0
    ? principal * Math.pow(1 + rate / 400, tenure / 91.25)
    : 0;
  const maturityDate = startStr && tenure
    ? new Date(new Date(startStr).getTime() + tenure * 86400000)
    : null;

  const onSubmit = async (data: F) => {
    const now = new Date();
    const matDate = data.startDate && data.fdTenureDays
      ? new Date(new Date(data.startDate).getTime() + data.fdTenureDays * 86400000)
      : undefined;
    const maturityAmt = data.fdMaturityAmount ?? (calcMaturity > 0 ? calcMaturity : data.fdPrincipal);

    const record: Omit<Investment, 'id' | 'createdAt'> = {
      name: data.name,
      type: data.fdType,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      fdPrincipal: data.fdPrincipal,
      fdRate: data.fdRate,
      fdTenureDays: data.fdTenureDays,
      fdMaturityAmount: maturityAmt,
      rdMonthlyInstalment: data.rdMonthlyInstalment,
      fdTdsApplicable: data.fdTdsApplicable,
      fdAutoRenewal: data.fdAutoRenewal,
      investedValue: data.fdPrincipal,
      currentValue: maturityAmt,
      maturityDate: matDate,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      interestRate: data.fdRate,
      currentNav: 0,
      units: 0,
      taxBenefit: false,
      familyMember: data.familyMember,
      notes: data.notes,
      frequency: data.fdType === 'RD' ? 'Monthly' : 'One-time',
      updatedAt: now,
    };
    if (initial?.id) {
      await db.investments.update(initial.id, record);
      toast.success('Updated');
    } else {
      await db.investments.add({ ...record, id: crypto.randomUUID(), createdAt: now });
      toast.success('Added');
    }
    onDone();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FDIcon className="h-4 w-4 text-muted-foreground" />
            {initial ? 'Edit' : 'Add'} {watch('fdType') === 'RD' ? 'Recurring' : 'Fixed'} Deposit
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {calcMaturity > 0 && (
            <div className="p-3 rounded-xl border border-success/20 bg-success/5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. maturity value</span>
                <span className="font-bold text-success">{formatCurrency(calcMaturity)}</span>
              </div>
              {maturityDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maturity date</span>
                  <span className="font-bold">{maturityDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. interest earned</span>
                <span className="font-bold">{formatCurrency(calcMaturity - principal)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="SBI FD – Tax Saver" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select defaultValue={initial?.type === 'RD' ? 'RD' : 'FD'} onValueChange={v => setValue('fdType', v as 'FD' | 'RD')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FD">Fixed Deposit (FD)</SelectItem>
                  <SelectItem value="RD">Recurring Deposit (RD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bank *</Label>
              <Input placeholder="SBI / HDFC / ICICI" {...register('bankName')} />
              {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Deposit / Account Number</Label>
              <Input placeholder="Receipt no. or account no." {...register('accountNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label>{fdType === 'RD' ? 'Total Deposited (₹)' : 'Principal (₹)'}</Label>
              <Input type="number" step="1000" {...register('fdPrincipal')} />
            </div>
            {fdType === 'RD' && (
              <div className="space-y-1.5">
                <Label>Monthly Instalment (₹)</Label>
                <Input type="number" step="500" placeholder="5000" {...register('rdMonthlyInstalment')} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Interest Rate (% p.a.)</Label>
              <Input type="number" step="0.05" placeholder="7.25" {...register('fdRate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Tenure (days)</Label>
              <Input type="number" step="1" placeholder="365" {...register('fdTenureDays')} />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Maturity Amount (₹) — optional override</Label>
              <Input type="number" step="100" {...register('fdMaturityAmount')} />
            </div>
            <div className="space-y-1.5">
              <Label>For</Label>
              <Select defaultValue={initial?.familyMember ?? 'Me'} onValueChange={v => setValue('familyMember', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Me', 'Mother', 'Grandmother', 'Brother'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={watch('fdTdsApplicable')} onCheckedChange={v => setValue('fdTdsApplicable', v)} id="tds" />
                <Label htmlFor="tds" className="text-xs">TDS Applicable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={watch('fdAutoRenewal')} onCheckedChange={v => setValue('fdAutoRenewal', v)} id="ar" />
                <Label htmlFor="ar" className="text-xs">Auto-Renewal</Label>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Nomination, linked to goal, etc." {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : initial ? 'Update' : `Add ${fdType}`}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
