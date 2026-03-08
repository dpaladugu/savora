
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Play, Pause, Repeat } from "lucide-react";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { RecurringTransactionService } from "@/services/RecurringTransactionService";
import type { RecurringTransaction } from "@/services/RecurringTransactionService";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-utils";

export function RecurringTransactionsPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await RecurringTransactionService.getAll());
    } catch {
      toast({ title: "Error", description: "Failed to load recurring transactions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      if (editing) {
        await RecurringTransactionService.update(editing.id, data);
        toast({ title: "Updated", description: "Recurring transaction updated." });
      } else {
        await RecurringTransactionService.create(data);
        toast({ title: "Created", description: "Recurring transaction added." });
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await RecurringTransactionService.delete(id);
      toast({ title: "Deleted", description: "Recurring transaction removed." });
      load();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: RecurringTransaction) => {
    try {
      await RecurringTransactionService.update(item.id, { is_active: !item.is_active });
      toast({ title: item.is_active ? "Paused" : "Resumed", description: item.description });
      load();
    } catch {
      toast({ title: "Error", description: "Failed to toggle.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Repeat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Recurring Transactions</h1>
            <p className="text-xs text-muted-foreground">{items.length} scheduled · income &amp; expense</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <RecurringTransactionForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
          initialData={editing as any}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Repeat className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No recurring transactions yet</p>
            <p className="text-xs text-muted-foreground text-center">Add salaries, SIPs, rent, or any scheduled payment</p>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add first one
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={`border-border/60 ${!item.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center gap-3 p-3.5">
                {/* Type badge */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  item.type === 'income' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                }`}>
                  {item.type === 'income' ? '+' : '−'}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
                    <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px] h-4">
                      {item.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.category} · every {item.interval > 1 ? `${item.interval} ` : ''}{item.frequency}
                    {item.account ? ` · ${item.account}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">Next: {item.next_date}</p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold tabular-nums shrink-0 ${
                  item.type === 'income' ? 'text-success' : 'text-destructive'
                }`}>
                  {item.type === 'income' ? '+' : '−'}₹{item.amount.toLocaleString('en-IN')}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(item)} title={item.is_active ? 'Pause' : 'Resume'}>
                    {item.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(item); setShowForm(true); }} title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)} disabled={loading} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
