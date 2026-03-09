/**
 * FabAddExpense — Floating Action Button for quick expense entry (mobile-only).
 * Renders above the bottom nav bar. Hidden on lg+ breakpoint.
 */
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import { EXPENSE_CATEGORIES } from '@/lib/categories';

export function FabAddExpense() {
  const [open, setOpen]           = useState(false);
  const [amount, setAmount]       = useState('');
  const [description, setDesc]    = useState('');
  const [category, setCategory]   = useState('Food & Dining');
  const [saving, setSaving]       = useState(false);

  const save = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const now = new Date();
      await db.expenses.add({
        id: crypto.randomUUID(),
        amount: amt,
        category,
        description: description || category,
        date: now,
        type: 'expense',
        createdAt: now,
        updatedAt: now,
      });
      toast.success(`₹${amt.toLocaleString('en-IN')} recorded`);
      setAmount(''); setDesc(''); setCategory('Food & Dining');
      setOpen(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* FAB button — above bottom nav, mobile only */}
      <div className="lg:hidden fixed bottom-[88px] right-4 z-40">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(o => !o)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
            open
              ? 'bg-destructive text-destructive-foreground rotate-45'
              : 'bg-primary text-primary-foreground'
          }`}
          aria-label={open ? 'Close' : 'Add Expense'}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.button>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-border bg-card p-5 pb-safe space-y-4"
              style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              {/* Handle */}
              <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />

              <p className="text-sm font-semibold text-foreground">Quick Add Expense</p>

              {/* Amount */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-border bg-background focus-within:border-primary transition-colors">
                <span className="text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>

              {/* Description */}
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDesc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              />

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['Food & Dining', 'Transport', 'Utilities', 'Healthcare', 'Groceries', 'Entertainment', 'Shopping', 'Misc'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      category === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border/60 bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={save}
                disabled={saving || !amount}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : `Save ${amount ? formatCurrency(parseFloat(amount) || 0) : ''}`}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
