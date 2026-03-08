import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Investment } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TrendingUp, X } from 'lucide-react';

const schema = z.object({
  name:           z.string().min(1, 'Fund name required'),
  type:           z.enum(['SIP', 'MF-Growth', 'MF-Dividend', 'Stocks']),
  investedValue:  z.coerce.number().nonnegative(),
  currentValue:   z.coerce.number().nonnegative(),
  units:          z.coerce.number().nonneg().optional(),
  currentNav:     z.coerce.number().nonneg().optional(),
  folioNo:        z.string().optional(),
  amcName:        z.string().optional(),
  schemeCode:     z.string().optional(),
  isSIP:          z.boolean().default(false),
  sipAmount:      z.coerce.number().nonneg().optional(),
  sipDay:         z.coerce.number().min(1).max(31).optional(),
  sipStartDate:   z.string().optional(),
  goalId:         z.string().optional(),
  familyMember:   z.string().default('Me'),
  notes:          z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function SIPMFForm({ initial, onDone }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || '',
      type: (initial?.type as F['type']) || 'MF-Growth',
      investedValue: initial?.investedValue || 0,
      currentValue: initial?.currentValue || 0,
      units: initial?.units,
      currentNav: initial?.currentNav,
      folioNo: initial?.folioNo || '',
      amcName: initial?.amcName || '',
      schemeCode: initial?.schemeCode || '',
      isSIP: initial?.isSIP || false,
      sipAmount: initial?.sipAmount,
      sipDay: initial?.sipDay,
      sipStartDate: initial?.sipStartDate?.toISOString().split('T')[0] || '',
      goalId: initial?.goalId || '',
      familyMember: initial?.familyMember || 'Me',
      notes: initial?.notes || '',
    },
  });
  const isSIP = watch('isSIP');

  const onSubmit = async (data: F) => {
    const now = new Date();
    const record: Partial<Investment> = {
      name: data.name, type: data.type,
      investedValue: data.investedValue, currentValue: data.currentValue,
      units: data.units || 0, currentNav: data.currentNav || 0,
      folioNo: data.folioNo, amcName: data.amcName, schemeCode: data.schemeCode,
      isSIP: data.isSIP, sipAmount: data.sipAmount, sipDay: data.sipDay,
      sipStartDate: data.sipStartDate ? new Date(data.sipStartDate) : undefined,
      goalId: data.goalId, familyMember: data.familyMember, notes: data.notes,
      taxBenefit: false, frequency: data.isSIP ? 'Monthly' : 'One-time',
      updatedAt: now,
    };
    if (initial?.id) {
      await db.investments.update(initial.id, record);
      toast.success('Updated');
    } else {
      await db.investments.add({ ...record, id: crypto.randomUUID(), createdAt: now } as Investment);
      toast.success('Added');
    }
    onDone();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            {initial ? 'Edit' : 'Add'} SIP / Mutual Fund
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Fund / Scheme Name *</Label>
              <Input placeholder="HDFC Mid-Cap Opportunities Fund" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select defaultValue={initial?.type || 'MF-Growth'} onValueChange={v => setValue('type', v as F['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MF-Growth">MF – Growth</SelectItem>
                  <SelectItem value="MF-Dividend">MF – Dividend</SelectItem>
                  <SelectItem value="SIP">SIP</SelectItem>
                  <SelectItem value="Stocks">Stocks / ETF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>AMC Name</Label>
              <Input placeholder="HDFC AMC" {...register('amcName')} />
            </div>

            <div className="space-y-1.5">
              <Label>Folio Number</Label>
              <Input placeholder="12345678" {...register('folioNo')} />
            </div>

            <div className="space-y-1.5">
              <Label>AMFI / Scheme Code</Label>
              <Input placeholder="120503" {...register('schemeCode')} />
            </div>

            <div className="space-y-1.5">
              <Label>Amount Invested (₹)</Label>
              <Input type="number" step="1" {...register('investedValue')} />
            </div>

            <div className="space-y-1.5">
              <Label>Current Value (₹)</Label>
              <Input type="number" step="1" {...register('currentValue')} />
            </div>

            <div className="space-y-1.5">
              <Label>Units Held</Label>
              <Input type="number" step="0.001" {...register('units')} />
            </div>

            <div className="space-y-1.5">
              <Label>Current NAV (₹)</Label>
              <Input type="number" step="0.0001" {...register('currentNav')} />
            </div>
          </div>

          {/* SIP toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Recurring SIP</p>
              <p className="text-xs text-muted-foreground">Enable if monthly debit is active</p>
            </div>
            <Switch checked={isSIP} onCheckedChange={v => setValue('isSIP', v)} />
          </div>

          {isSIP && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="space-y-1.5">
                <Label>Monthly SIP Amount (₹)</Label>
                <Input type="number" step="500" placeholder="5000" {...register('sipAmount')} />
              </div>
              <div className="space-y-1.5">
                <Label>Debit Day of Month</Label>
                <Input type="number" min="1" max="31" placeholder="5" {...register('sipDay')} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>SIP Start Date</Label>
                <Input type="date" {...register('sipStartDate')} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>For</Label>
              <Select defaultValue={initial?.familyMember || 'Me'} onValueChange={v => setValue('familyMember', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Me','Mother','Grandmother','Brother'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Optional" {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : initial ? 'Update' : 'Add Investment'}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
