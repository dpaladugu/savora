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
import { Building2, X } from 'lucide-react';

const schema = z.object({
  name:                 z.string().min(1, 'Label required'),
  uan:                  z.string().optional(),
  establishmentCode:    z.string().optional(),
  employeeContribution: z.coerce.number().nonnegative().optional(),
  employerContribution: z.coerce.number().nonnegative().optional(),
  investedValue:        z.coerce.number().nonnegative(),
  currentValue:         z.coerce.number().nonnegative(),
  notes:                z.string().optional(),
});
type F = z.infer<typeof schema>;

interface Props { initial?: Investment | null; onDone: () => void; }

export function EPFForm({ initial, onDone }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? 'My EPF',
      uan: initial?.uan ?? '',
      establishmentCode: initial?.establishmentCode ?? '',
      employeeContribution: initial?.employeeContribution ?? undefined,
      employerContribution: initial?.employerContribution ?? undefined,
      investedValue: initial?.investedValue ?? 0,
      currentValue: initial?.currentValue ?? 0,
      notes: initial?.notes ?? '',
    },
  });

  const onSubmit = async (data: F) => {
    const now = new Date();
    const record: Omit<Investment, 'id' | 'createdAt'> = {
      name: data.name,
      type: 'EPF',
      uan: data.uan,
      establishmentCode: data.establishmentCode,
      employeeContribution: data.employeeContribution,
      employerContribution: data.employerContribution,
      investedValue: data.investedValue,
      currentValue: data.currentValue,
      currentNav: 0,
      units: 0,
      taxBenefit: true,
      familyMember: 'Me',
      notes: data.notes,
      frequency: 'Monthly',
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
            <Building2 className="h-4 w-4 text-success" />{initial ? 'Edit' : 'Add'} EPF Account
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="My EPF – Company Name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>UAN</Label>
              <Input placeholder="100123456789" {...register('uan')} />
            </div>
            <div className="space-y-1.5">
              <Label>Establishment Code</Label>
              <Input placeholder="MHBAN1234567" {...register('establishmentCode')} />
            </div>
            <div className="space-y-1.5">
              <Label>Employee Contribution/mo (₹)</Label>
              <Input type="number" step="100" placeholder="1800" {...register('employeeContribution')} />
            </div>
            <div className="space-y-1.5">
              <Label>Employer Contribution/mo (₹)</Label>
              <Input type="number" step="100" placeholder="1800" {...register('employerContribution')} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Contributed (₹)</Label>
              <Input type="number" step="100" {...register('investedValue')} />
            </div>
            <div className="space-y-1.5">
              <Label>Current Balance (₹) — from EPFO passbook</Label>
              <Input type="number" step="100" {...register('currentValue')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Last statement date, etc." {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : initial ? 'Update' : 'Add EPF'}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
