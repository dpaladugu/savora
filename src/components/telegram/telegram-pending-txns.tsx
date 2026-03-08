/**
 * §23 Telegram Capture — Pending Transaction Review Queue
 * Parses /add <amount> <category> [mode] [note] commands.
 * ADMIN-only approve/reject before writing to the main ledger.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import {
  CheckCircle2, Trash2, Plus, MessageCircle, AlertCircle, Clock,
  Bot, Copy, ExternalLink, ShieldCheck, Zap, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { db, type PendingTxn } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRole } from '@/store/rbacStore';
import { EXPENSE_CATEGORIES } from '@/lib/categories';

// ── Parser: /add 500 food upi lunch at cafe ───────────────────────────────────
const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'NetBanking', 'Wallet', 'Cheque'];

function parseCommand(raw: string): Partial<PendingTxn> {
  const clean = raw.replace(/^\/add\s*/i, '').trim();
  const parts  = clean.split(/\s+/);
  const amount = parseFloat(parts[0]) || 0;

  // Second token: category (fuzzy match)
  const rawCat  = parts[1] || '';
  const matched = EXPENSE_CATEGORIES.find(c =>
    c.toLowerCase().startsWith(rawCat.toLowerCase())
  ) || (rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1) : 'Other');

  // Third token: optional payment mode
  let paymentMode: string | undefined;
  let noteStart = 2;
  if (parts[2] && PAYMENT_MODES.some(m => m.toLowerCase() === parts[2].toLowerCase())) {
    paymentMode = parts[2].toUpperCase();
    noteStart = 3;
  }

  const note = parts.slice(noteStart).join(' ');
  return { amount, category: matched, paymentMode, note };
}

// ── Bot setup info ─────────────────────────────────────────────────────────────
const BOT_COMMANDS = `/add 500 food upi lunch at cafe
/add 1200 transport ola ride
/add 2500 shopping online flipkart order
/add 50000 income salary monthly credit`;

export function TelegramPendingTxns() {
  const role = useRole();

  // Form state
  const [showAdd, setShowAdd]           = useState(false);
  const [commandText, setCommandText]   = useState('');
  const [amount, setAmount]             = useState('');
  const [category, setCategory]         = useState('Food');
  const [paymentMode, setPaymentMode]   = useState('UPI');
  const [note, setNote]                 = useState('');
  const [source, setSource]             = useState<PendingTxn['source']>('telegram');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Bot config
  const [botToken, setBotToken]         = useState(() => localStorage.getItem('tg-bot-token') || '');
  const [chatId, setChatId]             = useState(() => localStorage.getItem('tg-chat-id') || '');

  // Live data
  const allPending = useLiveQuery(async () => {
    try { return await (db as any).pendingTxns?.orderBy('createdAt').reverse().toArray() ?? []; }
    catch { return []; }
  }, []) as PendingTxn[];

  const displayed = (allPending || []).filter(p =>
    filterStatus === 'all' || p.status === filterStatus
  );

  const counts = {
    pending:  (allPending || []).filter(p => p.status === 'pending').length,
    approved: (allPending || []).filter(p => p.status === 'approved').length,
    rejected: (allPending || []).filter(p => p.status === 'rejected').length,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCommandChange = (val: string) => {
    setCommandText(val);
    if (val.trim()) {
      const p = parseCommand(val);
      if (p.amount)      setAmount(p.amount.toString());
      if (p.category)    setCategory(p.category);
      if (p.paymentMode) setPaymentMode(p.paymentMode);
      if (p.note !== undefined) setNote(p.note);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || !category) { toast.error('Amount and category are required'); return; }
    try {
      await (db as any).pendingTxns?.add({
        id: crypto.randomUUID(),
        rawText: commandText || `${amount} ${category} ${paymentMode} ${note}`.trim(),
        amount: amt,
        category,
        paymentMode,
        note,
        source,
        status: 'pending',
        createdAt: new Date(),
      });
      toast.success('Transaction queued for approval');
      setShowAdd(false);
      resetForm();
    } catch {
      toast.error('DB table not ready — restart app');
    }
  };

  const resetForm = () => {
    setCommandText(''); setAmount(''); setCategory('Food');
    setPaymentMode('UPI'); setNote('');
  };

  const handleApprove = async (p: PendingTxn) => {
    if (role !== 'ADMIN') { toast.error('Only ADMIN can approve'); return; }
    try {
      const isIncome = (p.category || '').toLowerCase().includes('income') ||
                       (p.note || '').toLowerCase().includes('salary');
      await db.txns.add({
        id: crypto.randomUUID(),
        date: new Date(),
        amount: isIncome ? Math.abs(p.amount) : -Math.abs(p.amount),
        currency: 'INR',
        category: p.category,
        note: p.note || p.rawText,
        tags: ['telegram'],
        isPartialRent: false,
        paymentMix: [{ mode: (p.paymentMode === 'Cash' || p.paymentMode === 'Card' || p.paymentMode === 'UPI' || p.paymentMode === 'Bank' ? p.paymentMode : 'UPI') as 'Cash' | 'Card' | 'UPI' | 'Bank', amount: Math.abs(p.amount) }],
        isSplit: false,
        splitWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await (db as any).pendingTxns?.update(p.id, { status: 'approved' });
      toast.success(`✅ ₹${p.amount.toLocaleString('en-IN')} → ${isIncome ? 'income' : 'expense'} ledger`);
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleReject   = (id: string) => (db as any).pendingTxns?.update(id, { status: 'rejected' }).then(() => toast.info('Rejected'));
  const handleDelete   = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await (db as any).pendingTxns?.delete(id);
    toast.success('Deleted');
  };

  const saveBotConfig = () => {
    localStorage.setItem('tg-bot-token', botToken);
    localStorage.setItem('tg-chat-id',   chatId);
    toast.success('Bot config saved locally');
  };

  const StatusBadge = ({ s }: { s: PendingTxn['status'] }) =>
    s === 'approved' ? <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Approved</Badge> :
    s === 'rejected' ? <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive gap-1"><AlertCircle className="h-2.5 w-2.5" />Rejected</Badge> :
    <Badge variant="outline" className="text-[10px] border-warning/40 text-warning gap-1"><Clock className="h-2.5 w-2.5" />Pending</Badge>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Telegram Capture"
        subtitle="§23 · Bot queue → one-tap confirm"
        icon={MessageCircle}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Capture
          </Button>
        }
      />

      <Tabs defaultValue="queue">
        <TabsList className="grid grid-cols-2 w-full rounded-2xl p-1 bg-muted/60 border border-border/40 h-auto gap-0.5">
          <TabsTrigger value="queue"
            className="tab-trigger flex items-center gap-1.5 py-2 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Review Queue
            {counts.pending > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-warning-foreground text-[9px] font-bold">
                {counts.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="setup"
            className="tab-trigger flex items-center gap-1.5 py-2 rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            Bot Setup
          </TabsTrigger>
        </TabsList>

        {/* ── QUEUE TAB ── */}
        <TabsContent value="queue" className="mt-3 space-y-3">

          {/* Stat chips */}
          <div className="grid grid-cols-3 gap-2">
            {(['pending', 'approved', 'rejected'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s === filterStatus ? 'all' : s)}
                className={`rounded-xl border p-3 text-center transition-all ${filterStatus === s ? 'border-primary/50 bg-primary/10' : 'border-border/50 bg-card/60'}`}>
                <p className="text-[10px] text-muted-foreground capitalize mb-1">{s}</p>
                <p className={`text-lg font-bold tabular-nums ${s === 'pending' ? 'text-warning' : s === 'approved' ? 'text-success' : 'text-destructive'}`}>
                  {counts[s]}
                </p>
              </button>
            ))}
          </div>

          {/* How-to hint */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
            <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Send <code className="font-mono bg-muted px-1 rounded text-[10px]">/add 500 food upi lunch</code> in Telegram → queued here → ADMIN approves → saved to ledger.</span>
          </div>

          {/* List */}
          {displayed.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No {filterStatus === 'all' ? '' : filterStatus} transactions yet.</p>
                <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs mt-1">
                  <Plus className="h-3.5 w-3.5" /> Capture manually
                </Button>
              </CardContent>
            </Card>
          ) : displayed.map(p => (
            <Card key={p.id} className={p.status !== 'pending' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-sm font-bold tabular-nums ${p.amount > 0 ? 'text-destructive' : 'text-success'}`}>
                        ₹{Math.abs(p.amount).toLocaleString('en-IN')}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                      {p.paymentMode && <Badge variant="outline" className="text-[10px]">{p.paymentMode}</Badge>}
                      <Badge variant="outline" className={`text-[10px] ${p.source === 'telegram' ? 'border-primary/30 text-primary' : ''}`}>
                        {p.source === 'telegram' ? '🤖' : '✍️'} {p.source}
                      </Badge>
                      <StatusBadge s={p.status} />
                    </div>
                    {p.note && <p className="text-xs text-muted-foreground mb-0.5">{p.note}</p>}
                    <p className="text-[10px] font-mono text-muted-foreground/60">{p.rawText}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 items-start">
                    {p.status === 'pending' && role === 'ADMIN' && (
                      <>
                        <Button size="icon" variant="ghost" title="Approve"
                          className="h-8 w-8 rounded-lg text-success hover:bg-success/10"
                          onClick={() => handleApprove(p)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Reject"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(p.id)}>
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" title="Delete"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── BOT SETUP TAB ── */}
        <TabsContent value="setup" className="mt-3 space-y-3">

          {/* Privacy banner */}
          <Card className="border-success/30 bg-success/5">
            <CardContent className="py-3 px-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success shrink-0" />
              <p className="text-xs text-success">
                <strong>Offline-first:</strong> Bot token & chat ID stored in your browser only. No server sees your data — all approval happens locally in this app.
              </p>
            </CardContent>
          </Card>

          {/* Step 1: Bot creation */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
                Create Your Telegram Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-xs text-muted-foreground">
              <ol className="space-y-1 list-none">
                {[
                  'Open Telegram → search @BotFather',
                  'Send /newbot and follow prompts',
                  'Copy the API token BotFather gives you',
                  'Start a chat with your new bot',
                  'Send any message, then get your chat ID below',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary text-[11px] font-medium mt-1">
                Open @BotFather <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          {/* Step 2: Config */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
                Enter Your Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Bot Token</Label>
                <Input type="password" value={botToken} onChange={e => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdef..." className="h-9 text-xs font-mono" />
                <p className="text-[10px] text-muted-foreground">From @BotFather. Stored only in your browser's localStorage.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chat ID</Label>
                <Input value={chatId} onChange={e => setChatId(e.target.value)}
                  placeholder="Your numeric chat ID e.g. 123456789" className="h-9 text-xs font-mono" />
                <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-[10px] mt-0.5">
                  Get via @userinfobot <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <Button onClick={saveBotConfig} className="w-full gap-2" size="sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Save Config Locally
              </Button>
            </CardContent>
          </Card>

          {/* Step 3: Commands */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
                Bot Command Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
                <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {`/add <amount> <category> [mode] [note]

Examples:
/add 500 food upi lunch at cafe
/add 1200 transport cash auto
/add 2500 shopping card amazon
/add 50000 income salary monthly

Supported modes: UPI Cash Card NetBanking`}
                </pre>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs"
                onClick={() => { navigator.clipboard.writeText(BOT_COMMANDS); toast.success('Commands copied'); }}>
                <Copy className="h-3.5 w-3.5" /> Copy Example Commands
              </Button>
            </CardContent>
          </Card>

          {/* Webhook note */}
          <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" /> How it works (offline-first)
            </p>
            <p>Since Savora is fully offline, the bot doesn't auto-push messages. Instead:</p>
            <ol className="space-y-0.5 ml-3 list-decimal">
              <li>You send /add commands in Telegram (saved in bot chat)</li>
              <li>Use "Capture" button above to paste and auto-parse the command</li>
              <li>ADMIN reviews and approves here → written to IndexedDB ledger</li>
            </ol>
            <p className="text-[10px] italic">Future: a Supabase Edge Function webhook can push directly into this queue.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Capture Modal ── */}
      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Capture Transaction
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Paste Telegram /add command (auto-parses)</Label>
              <Input
                value={commandText}
                onChange={e => handleCommandChange(e.target.value)}
                placeholder="/add 500 food upi lunch at cafe"
                className="h-9 text-xs font-mono"
                autoFocus
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-9 text-sm" required min={0.01} step={0.01} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-52">
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source</Label>
                <Select value={source} onValueChange={v => setSource(v as PendingTxn['source'])}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram" className="text-xs">🤖 Telegram</SelectItem>
                    <SelectItem value="manual" className="text-xs">✍️ Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Note (optional)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} className="h-9 text-sm" placeholder="Brief description" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="flex-1 h-9 text-xs gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" /> Queue for Approval
              </Button>
              <Button type="button" size="sm" variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setShowAdd(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
