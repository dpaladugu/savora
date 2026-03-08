/**
 * PendingTxn — Telegram-captured "intent" transactions awaiting ADMIN approval.
 * Stored in the main db.pendingTxns table (added in db-schema-extended version 3).
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { CheckCircle2, Trash2, Plus, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '@/lib/format-utils';
import { useRole } from '@/store/rbacStore';
import { EXPENSE_CATEGORIES } from '@/lib/categories';

// Re-use the same PendingTxn type from the extended DB; if not yet present we declare it here
export interface PendingTxn {
  id: string;
  rawText: string;       // original /add command or message
  amount: number;
  category: string;
  note: string;
  source: 'telegram' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

/** Parse "/add 500 food lunch at cafe" → { amount, category, note } */
function parseCommand(raw: string): Partial<Pick<PendingTxn, 'amount' | 'category' | 'note'>> {
  const clean = raw.replace(/^\/add\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  const amount = parseFloat(parts[0]) || 0;
  const category = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Other';
  const note = parts.slice(2).join(' ');
  return { amount, category, note };
}

const SOURCE_LABELS: Record<PendingTxn['source'], string> = {
  telegram: 'Telegram',
  manual: 'Manual',
};

export function TelegramPendingTxns() {
  const role = useRole();
  const [showAdd, setShowAdd] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [parsedAmount, setParsedAmount] = useState('');
  const [parsedCategory, setParsedCategory] = useState('Food');
  const [parsedNote, setParsedNote] = useState('');
  const [source, setSource] = useState<PendingTxn['source']>('telegram');

  // Live query — works with the extended DB pendingTxns table
  const pending = useLiveQuery(async () => {
    try { return await (db as any).pendingTxns?.orderBy('createdAt').reverse().toArray() ?? []; }
    catch { return []; }
  }, []) as PendingTxn[] || [];

  const pendingCount   = pending.filter(p => p.status === 'pending').length;
  const approvedCount  = pending.filter(p => p.status === 'approved').length;
  const rejectedCount  = pending.filter(p => p.status === 'rejected').length;

  const handleCommandChange = (val: string) => {
    setCommandText(val);
    if (val.trim()) {
      const parsed = parseCommand(val);
      if (parsed.amount) setParsedAmount(parsed.amount.toString());
      if (parsed.category) setParsedCategory(parsed.category);
      if (parsed.note !== undefined) setParsedNote(parsed.note);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(parsedAmount);
    if (!amount || !parsedCategory) {
      toast.error('Amount and category are required');
      return;
    }
    try {
      await (db as any).pendingTxns?.add({
        id: crypto.randomUUID(),
        rawText: commandText || `${parsedAmount} ${parsedCategory} ${parsedNote}`,
        amount,
        category: parsedCategory,
        note: parsedNote,
        source,
        status: 'pending',
        createdAt: new Date(),
      });
      toast.success('Pending transaction captured');
      setShowAdd(false);
      setCommandText('');
      setParsedAmount('');
      setParsedCategory('Food');
      setParsedNote('');
    } catch {
      toast.error('Failed to add — table may not exist yet');
    }
  };

  const handleApprove = async (p: PendingTxn) => {
    if (role !== 'ADMIN') { toast.error('Only ADMIN can approve transactions'); return; }
    try {
      // Write to actual txns table
      await db.txns.add({
        id: crypto.randomUUID(),
        date: new Date(),
        amount: p.amount,
        currency: 'INR',
        category: p.category,
        note: p.note || p.rawText,
        tags: ['telegram'],
        isPartialRent: false,
        paymentMix: [{ mode: 'UPI', amount: p.amount }],
        isSplit: false,
      });
      await (db as any).pendingTxns?.update(p.id, { status: 'approved' });
      toast.success(`₹${p.amount.toLocaleString('en-IN')} approved & saved as expense`);
    } catch {
      toast.error('Failed to approve transaction');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await (db as any).pendingTxns?.update(id, { status: 'rejected' });
      toast.success('Transaction rejected');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pending entry?')) return;
    await (db as any).pendingTxns?.delete(id);
    toast.success('Deleted');
  };

  const statusBadge = (s: PendingTxn['status']) => {
    if (s === 'approved') return <Badge variant="outline" className="text-[10px] border-success/40 text-success">Approved</Badge>;
    if (s === 'rejected') return <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">Rejected</Badge>;
    return <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">Pending</Badge>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pending Transactions"
        subtitle="Telegram-captured entries awaiting approval"
        icon={MessageCircle}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Capture
          </Button>
        }
      />

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pending',  count: pendingCount,  cls: 'text-warning'     },
          { label: 'Approved', count: approvedCount, cls: 'value-positive'   },
          { label: 'Rejected', count: rejectedCount, cls: 'text-destructive' },
        ].map(({ label, count, cls }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className={`text-lg font-bold tabular-nums ${cls}`}>{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How-to hint */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
        <MessageCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>Send <code className="font-mono bg-muted px-1 rounded">/add 500 food lunch at cafe</code> in Telegram to queue a transaction. ADMIN approves it here before it's saved.</span>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No pending transactions yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Use the Capture button to add one manually, or send a /add command via Telegram.</p>
            </CardContent>
          </Card>
        ) : pending.map(p => (
          <Card key={p.id} className={`glass ${p.status !== 'pending' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <p className="text-sm font-semibold value-negative tabular-nums">₹{p.amount.toLocaleString('en-IN')}</p>
                    <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{SOURCE_LABELS[p.source]}</Badge>
                    {statusBadge(p.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.note || p.rawText}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(p.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {p.status === 'pending' && role === 'ADMIN' && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-success hover:bg-success/10" onClick={() => handleApprove(p)} aria-label="Approve">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleReject(p.id)} aria-label="Reject">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capture Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Capture Pending Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Telegram command / text</Label>
              <Input
                value={commandText}
                onChange={e => handleCommandChange(e.target.value)}
                placeholder="/add 500 food lunch"
                className="h-9 text-sm font-mono"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">Paste a /add command to auto-parse, or fill fields below manually.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" value={parsedAmount} onChange={e => setParsedAmount(e.target.value)} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select value={parsedCategory} onValueChange={setParsedCategory}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.slice(0, 15).map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Note</Label>
              <Input value={parsedNote} onChange={e => setParsedNote(e.target.value)} className="h-9 text-sm" placeholder="Optional note" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Select value={source} onValueChange={v => setSource(v as PendingTxn['source'])}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram" className="text-xs">Telegram</SelectItem>
                  <SelectItem value="manual" className="text-xs">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs">Queue</Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
