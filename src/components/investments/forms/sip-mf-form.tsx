import React, { useEffect } from 'react';
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
import { TrendingUp, X, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

const MF_TYPES = ['MF-Growth', 'MF-Dividend', 'SIP', 'Stocks'] as const;
type MFType = typeof MF_TYPES[number];

const schema = z.object({
  name:          z.string().min(1, 'Fund name required'),
  mfType:        z.enum(MF_TYPES),
  investedValue: z.coerce.number().nonnegative(),
  currentValue:  z.coerce.number().nonnegative(),
  units:         z.coerce.number().nonnegative().optional(),
  currentNav:    z.coerce.number().nonnegative().optional(),
  purchaseNav:   z.coerce.number().nonnegative().optional(),
  folioNo:       z.string().optional(),
  amcName:       z.string().optional(),
  schemeCode:    z.string().optional(),
  isSIP:         z.boolean().default(false),
  sipAmount:     z.coerce.number().nonnegative().optional(),
  sipDay:        z.coerce.number().min(1).max(31).optional(),
  sipStartDate:  z.string().optional(),
  goalId:        z.string().optional(),
  familyMember:  z.string().default('Me'),
  notes:         z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function SIPMFForm({ initial, onDone }: Props) {
  const initType: MFType = (MF_TYPES as readonly string[]).includes(initial?.type ?? '')
    ? (initial!.type as MFType)
    : 'MF-Growth';

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         initial?.name ?? '',
      mfType:       initType,
      investedValue:initial?.investedValue ?? 0,
      currentValue: initial?.currentValue  ?? 0,
      units:        initial?.units,
      currentNav:   initial?.currentNav,
      purchaseNav:  (initial as any)?.purchaseNav,
      folioNo:      initial?.folioNo ?? '',
      amcName:      initial?.amcName ?? '',
      schemeCode:   initial?.schemeCode ?? '',
      isSIP:        initial?.isSIP ?? false,
      sipAmount:    initial?.sipAmount,
      sipDay:       initial?.sipDay,
      sipStartDate: initial?.sipStartDate ? new Date(initial.sipStartDate).toISOString().split('T')[0] : '',
      goalId:       initial?.goalId ?? '',
      familyMember: initial?.familyMember ?? 'Me',
      notes:        initial?.notes ?? '',
    },
  });
  const isSIP = watch('isSIP');

  // ── Auto-calc: units × currentNav → currentValue ──────────────────────────
  const units      = watch('units');
  const currentNav = watch('currentNav');
  const purchaseNav = watch('purchaseNav');

  useEffect(() => {
    if (units && units > 0 && currentNav && currentNav > 0) {
      setValue('currentValue', parseFloat((units * currentNav).toFixed(2)));
    }
  }, [units, currentNav, setValue]);

  // Auto-calc invested value from purchaseNav × units
  useEffect(() => {
    if (units && units > 0 && purchaseNav && purchaseNav > 0) {
      setValue('investedValue', parseFloat((units * purchaseNav).toFixed(2)));
    }
  }, [units, purchaseNav, setValue]);

  // Live gain/loss preview
  const investedValue = watch('investedValue');
  const currentValue  = watch('currentValue');
  const gain = (currentValue || 0) - (investedValue || 0);
  const gainPct = (investedValue || 0) > 0 ? (gain / (investedValue || 0)) * 100 : 0;

  const onSubmit = async (data: F) => {
    const now = new Date();
    const record: Omit<Investment, 'id' | 'createdAt'> = {
      name:          data.name,
      type:          data.mfType as Investment['type'],
      investedValue: data.investedValue,
      currentValue:  data.currentValue,
      units:         data.units ?? 0,
      currentNav:    data.currentNav ?? 0,
      folioNo:       data.folioNo,
      amcName:       data.amcName,
      schemeCode:    data.schemeCode,
      isSIP:         data.isSIP,
      sipAmount:     data.sipAmount,
      sipDay:        data.sipDay,
      sipStartDate:  data.sipStartDate ? new Date(data.sipStartDate) : undefined,
      goalId:        data.goalId || undefined,
      familyMember:  data.familyMember,
      notes:         data.notes,
      taxBenefit:    false,
      frequency:     data.isSIP ? 'Monthly' : 'One-time',
      updatedAt:     now,
      purchaseNav:   data.purchaseNav,
    } as any;
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
              <Select defaultValue={initType} onValueChange={v => setValue('mfType', v as MFType)}>
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

            {/* ── NAV + Units auto-calc row ───────────────────────────────── */}
            <div className="space-y-1.5">
              <Label>Units Held</Label>
              <Input type="number" step="0.001" placeholder="e.g. 245.532" {...register('units')} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Current NAV (₹)
                <Sparkles className="h-3 w-3 text-primary" title="Auto-computes Current Value" />
              </Label>
              <Input type="number" step="0.0001" placeholder="e.g. 58.42" {...register('currentNav')} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Purchase NAV (₹)
                <Sparkles className="h-3 w-3 text-primary" title="Auto-computes Invested Value" />
              </Label>
              <Input type="number" step="0.0001" placeholder="e.g. 42.10" {...register('purchaseNav')} />
            </div>

            {/* Computed / manual override fields */}
            <div className="space-y-1.5">
              <Label>Amount Invested (₹)</Label>
              <Input type="number" step="1" {...register('investedValue')} />
              <p className="text-[10px] text-muted-foreground">Auto = Units × Purchase NAV</p>
            </div>
            <div className="space-y-1.5">
              <Label>Current Value (₹)</Label>
              <Input type="number" step="1" {...register('currentValue')} />
              <p className="text-[10px] text-muted-foreground">Auto = Units × Current NAV</p>
            </div>
          </div>

          {/* Live P&L preview */}
          {investedValue > 0 && currentValue > 0 && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${
              gain >= 0 ? 'bg-success/5 border-success/20 text-success' : 'bg-destructive/5 border-destructive/20 text-destructive'
            }`}>
              <span>Unrealised {gain >= 0 ? 'Gain' : 'Loss'}</span>
              <span className="tabular-nums font-bold">
                {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%)
              </span>
            </div>
          )}

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
                <Input type="number" step="1" min="1" placeholder="e.g. 7300" {...register('sipAmount')} />
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
              <Select defaultValue={initial?.familyMember ?? 'Me'} onValueChange={v => setValue('familyMember', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Me', 'Mother', 'Grandmother', 'Brother'].map(m =>
                    <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
