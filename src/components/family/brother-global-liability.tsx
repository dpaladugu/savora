import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, Globe, TrendingDown, AlertTriangle,
  Plus, Calculator, Building
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { MaskedAmount } from '@/components/ui/masked-value';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const USD_TO_INR = 83; // Fixed rate
const INCRED_LOAN = {
  principal: 2321156,
  interestRate: 14.2,
  label: 'InCred Loan',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface USHandLoan {
  id: string;
  description: string;
  amountUSD: number;
  amountINR: number;
  lender: string;
  dueDate: string;
  status: 'Active' | 'Settled';
}

interface CarLoan {
  id: string;
  vehicle: string;
  amountUSD: number;
  amountINR: number;
  bank: string;
  interestRate: number;
  monthlyEMI: number;
  remainingMonths: number;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function BrotherGlobalLiability() {
  const [handLoans, setHandLoans] = useState<USHandLoan[]>([]);
  const [carLoans, setCarLoans] = useState<CarLoan[]>([]);
  const [showAddHandLoan, setShowAddHandLoan] = useState(false);
  const [showAddCarLoan, setShowAddCarLoan] = useState(false);

  // Hand loan form
  const [hlForm, setHlForm] = useState({
    description: '',
    amountUSD: '',
    lender: '',
    dueDate: '',
  });

  // Car loan form
  const [clForm, setClForm] = useState({
    vehicle: '',
    amountUSD: '',
    bank: '',
    interestRate: '',
    monthlyEMI: '',
    remainingMonths: '',
  });

  const inCredMonthlyInterest = (INCRED_LOAN.principal * INCRED_LOAN.interestRate) / (100 * 12);

  const totalUSDebt_USD = handLoans.reduce((s, l) => s + l.amountUSD, 0) +
    carLoans.reduce((s, l) => s + l.amountUSD, 0);
  const totalUSDebt_INR = totalUSDebt_USD * USD_TO_INR;
  const totalGlobalDebt_INR = INCRED_LOAN.principal + totalUSDebt_INR;

  const handleAddHandLoan = () => {
    if (!hlForm.description || !hlForm.amountUSD) {
      toast.error('Please fill required fields');
      return;
    }
    const amountUSD = parseFloat(hlForm.amountUSD);
    const newLoan: USHandLoan = {
      id: crypto.randomUUID(),
      description: hlForm.description,
      amountUSD,
      amountINR: amountUSD * USD_TO_INR,
      lender: hlForm.lender,
      dueDate: hlForm.dueDate,
      status: 'Active',
    };
    setHandLoans(prev => [...prev, newLoan]);
    setHlForm({ description: '', amountUSD: '', lender: '', dueDate: '' });
    setShowAddHandLoan(false);
    toast.success('US Hand Loan added');
  };

  const handleAddCarLoan = () => {
    if (!clForm.vehicle || !clForm.amountUSD) {
      toast.error('Please fill required fields');
      return;
    }
    const amountUSD = parseFloat(clForm.amountUSD);
    const newLoan: CarLoan = {
      id: crypto.randomUUID(),
      vehicle: clForm.vehicle,
      amountUSD,
      amountINR: amountUSD * USD_TO_INR,
      bank: clForm.bank,
      interestRate: parseFloat(clForm.interestRate) || 0,
      monthlyEMI: parseFloat(clForm.monthlyEMI) || 0,
      remainingMonths: parseInt(clForm.remainingMonths) || 0,
    };
    setCarLoans(prev => [...prev, newLoan]);
    setClForm({ vehicle: '', amountUSD: '', bank: '', interestRate: '', monthlyEMI: '', remainingMonths: '' });
    setShowAddCarLoan(false);
    toast.success('US Car Loan added');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Global Liability Dashboard
        </h2>
        <Badge variant="destructive">
          Net: {formatCurrency(totalGlobalDebt_INR)}
        </Badge>
      </div>

      {/* USD ↔ INR Converter */}
      <USDConverter />

      {/* InCred Loan (Pre-populated) */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4 text-destructive" />
              InCred Loan (India)
            </span>
            <Badge variant="destructive">{INCRED_LOAN.interestRate}% p.a.</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-bold text-destructive">
                <MaskedAmount amount={INCRED_LOAN.principal} permission="showBrotherUS" />
              </p>
            </div>
            <div className="p-2 rounded-lg bg-background border">
              <p className="text-xs text-muted-foreground">Monthly Interest</p>
              <p className="font-bold">
                <MaskedAmount amount={inCredMonthlyInterest} permission="showBrotherUS" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* US Hand Loans */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              US Hand Loans (USD)
            </span>
            <Button size="sm" onClick={() => setShowAddHandLoan(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {handLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No US hand loans recorded</p>
          ) : (
            handLoans.map(loan => (
              <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{loan.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.lender && `From: ${loan.lender} · `}
                    Due: {loan.dueDate || 'Open'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${loan.amountUSD.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">= {formatCurrency(loan.amountINR)}</p>
                </div>
              </div>
            ))
          )}

          {handLoans.length > 0 && (
            <div className="flex justify-between text-sm border-t pt-2 font-semibold">
              <span>Total US Hand Loans</span>
              <span>${totalUSDebt_USD.toLocaleString()} = {formatCurrency(totalUSDebt_INR)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* US Car Loans */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>US Car Loans</span>
            <Button size="sm" onClick={() => setShowAddCarLoan(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {carLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No US car loans recorded</p>
          ) : (
            carLoans.map(loan => (
              <div key={loan.id} className="p-3 rounded-lg border space-y-1">
                <div className="flex justify-between">
                  <p className="font-medium text-sm">{loan.vehicle}</p>
                  <p className="font-bold text-sm">${loan.amountUSD.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{loan.bank} · {loan.interestRate}% p.a.</span>
                  <span>= {formatCurrency(loan.amountINR)}</span>
                </div>
                {loan.monthlyEMI > 0 && (
                  <p className="text-xs text-muted-foreground">
                    EMI: ${loan.monthlyEMI}/mo · {loan.remainingMonths} months left
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Net Global Impact */}
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Net Global Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">InCred Loan (India)</span>
              <span><MaskedAmount amount={INCRED_LOAN.principal} permission="showBrotherUS" /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">US Liabilities (×₹{USD_TO_INR})</span>
              <span><MaskedAmount amount={totalUSDebt_INR} permission="showBrotherUS" /></span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total Global Debt</span>
              <span className="text-destructive"><MaskedAmount amount={totalGlobalDebt_INR} permission="showBrotherUS" /></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Hand Loan Dialog */}
      <Dialog open={showAddHandLoan} onOpenChange={setShowAddHandLoan}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add US Hand Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Description *</Label>
              <Input value={hlForm.description} onChange={e => setHlForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g., Phone loan from John" />
            </div>
            <div>
              <Label>Amount (USD) *</Label>
              <Input type="number" value={hlForm.amountUSD} onChange={e => setHlForm(f => ({ ...f, amountUSD: e.target.value }))} placeholder="0" />
              {hlForm.amountUSD && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatCurrency(parseFloat(hlForm.amountUSD || '0') * USD_TO_INR)} (at ₹{USD_TO_INR}/USD)
                </p>
              )}
            </div>
            <div>
              <Label>Lender</Label>
              <Input value={hlForm.lender} onChange={e => setHlForm(f => ({ ...f, lender: e.target.value }))} placeholder="Name" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={hlForm.dueDate} onChange={e => setHlForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddHandLoan(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddHandLoan} className="flex-1">Add Loan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Car Loan Dialog */}
      <Dialog open={showAddCarLoan} onOpenChange={setShowAddCarLoan}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add US Car Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Vehicle *</Label>
              <Input value={clForm.vehicle} onChange={e => setClForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="e.g., Honda Civic 2023" />
            </div>
            <div>
              <Label>Loan Amount (USD) *</Label>
              <Input type="number" value={clForm.amountUSD} onChange={e => setClForm(f => ({ ...f, amountUSD: e.target.value }))} />
              {clForm.amountUSD && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatCurrency(parseFloat(clForm.amountUSD || '0') * USD_TO_INR)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Bank</Label>
                <Input value={clForm.bank} onChange={e => setClForm(f => ({ ...f, bank: e.target.value }))} />
              </div>
              <div>
                <Label>Interest %</Label>
                <Input type="number" value={clForm.interestRate} onChange={e => setClForm(f => ({ ...f, interestRate: e.target.value }))} />
              </div>
              <div>
                <Label>Monthly EMI ($)</Label>
                <Input type="number" value={clForm.monthlyEMI} onChange={e => setClForm(f => ({ ...f, monthlyEMI: e.target.value }))} />
              </div>
              <div>
                <Label>Months Left</Label>
                <Input type="number" value={clForm.remainingMonths} onChange={e => setClForm(f => ({ ...f, remainingMonths: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddCarLoan(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddCarLoan} className="flex-1">Add Loan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── USD CONVERTER ────────────────────────────────────────────────────────────
function USDConverter() {
  const [usd, setUsd] = useState('');
  const [inr, setInr] = useState('');

  const handleUSDChange = (val: string) => {
    setUsd(val);
    const num = parseFloat(val);
    setInr(isNaN(num) ? '' : (num * USD_TO_INR).toFixed(2));
  };

  const handleINRChange = (val: string) => {
    setInr(val);
    const num = parseFloat(val);
    setUsd(isNaN(num) ? '' : (num / USD_TO_INR).toFixed(2));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          USD ↔ INR Converter
          <Badge variant="outline" className="ml-auto">Fixed: ₹{USD_TO_INR}/USD</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label className="text-xs">USD ($)</Label>
            <Input
              type="number"
              value={usd}
              onChange={e => handleUSDChange(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
          <div className="pt-5 text-muted-foreground font-bold">=</div>
          <div className="flex-1">
            <Label className="text-xs">INR (₹)</Label>
            <Input
              type="number"
              value={inr}
              onChange={e => handleINRChange(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
