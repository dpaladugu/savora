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
import { toast } from 'sonner';
import { PiggyBank, X, Info } from 'lucide-react';

const schema = z.object({
  name:                  z.string().min(1, 'Label required'),
  ppfAccountNo:          z.string().optional(),
  ppfBank:               z.string().optional(),
  ppfOpenDate:           z.string().optional(),
  ppfAnnualContribution: z.coerce.number().nonnegative().max(150000, 'Max 80C limit is ₹1,50,000').optional(),
  ppf80CUsed:            z.coerce.number().nonnegative().optional(),
  investedValue:         z.coerce.number().nonnegative(),
  currentValue:          z.coerce.number().nonnegative(),
  notes:                 z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function PPFForm({ initial, onDone }: Props) {
  const { register, setValue, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? 'My PPF',
      ppfAccountNo: initial?.ppfAccountNo ?? '',
      ppfBank: initial?.ppfBank ?? 'SBI',
      ppfOpenDate: initial?.ppfOpenDate ? new Date(initial.ppfOpenDate).toISOString().split('T')[0] : '',
      ppfAnnualContribution: initial?.ppfAnnualContribution ?? undefined,
      ppf80CUsed: initial?.ppf80CUsed ?? undefined,
      investedValue: initial?.investedValue ?? 0,
      currentValue: initial?.currentValue ?? 0,
      notes: initial?.notes ?? '',
    },
  });

  const openDate = watch('ppfOpenDate');
  const maturityYear = openDate ? new Date(openDate).getFullYear() + 15 : null;

  const onSubmit = async (data: F) => {
    const now = new Date();
    const matDate = data.ppfOpenDate
      ? (() => { const d = new Date(data.ppfOpenDate!); d.setFullYear(d.getFullYear() + 15); return d; })()
      : undefined;
    const record: Omit<Investment, 'id' | 'createdAt'> = {
      name: data.name,
      type: 'PPF',
      ppfAccountNo: data.ppfAccountNo,
      ppfBank: data.ppfBank,
      ppfOpenDate: data.ppfOpenDate ? new Date(data.ppfOpenDate) : undefined,
      ppfAnnualContribution: data.ppfAnnualContribution,
      ppf80CUsed: data.ppf80CUsed,
      investedValue: data.investedValue,
      currentValue: data.currentValue,
      maturityDate: matDate,
      lockInYears: 15,
      currentNav: 0,
      units: 0,
      taxBenefit: true,
      familyMember: 'Me',
      notes: data.notes,
      frequency: 'Yearly',
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
            <PiggyBank className="h-4 w-4 text-warning" />{initial ? 'Edit' : 'Add'} PPF Account
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {maturityYear && (
            <div className="flex items-center gap-2 text-xs text-success p-2 rounded-lg bg-success/10 border border-success/20">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Account matures in <strong>{maturityYear}</strong> (15-year lock-in)
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="My PPF – SBI" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input placeholder="SB-1234567" {...register('ppfAccountNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Bank / Post Office</Label>
              <Select defaultValue={initial?.ppfBank ?? 'SBI'} onValueChange={v => setValue('ppfBank', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['SBI', 'Post Office', 'HDFC', 'ICICI', 'Axis', 'BOI', 'PNB', 'Other'].map(b =>
                    <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Account Opening Date (for 15-yr maturity calc)</Label>
              <Input type="date" {...register('ppfOpenDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Annual Contribution (₹) — max ₹1.5L</Label>
              <Input type="number" step="500" placeholder="150000" {...register('ppfAnnualContribution')} />
              {errors.ppfAnnualContribution && <p className="text-xs text-destructive">{errors.ppfAnnualContribution.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>80C Claimed This FY (₹)</Label>
              <Input type="number" step="500" placeholder="150000" {...register('ppf80CUsed')} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Deposited (₹)</Label>
              <Input type="number" step="100" {...register('investedValue')} />
            </div>
            <div className="space-y-1.5">
              <Label>Current Balance (₹) — from passbook</Label>
              <Input type="number" step="100" {...register('currentValue')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Loan taken, nominations, etc." {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : initial ? 'Update' : 'Add PPF'}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
