/**
 * FuelioImporter — parses semicolon-delimited Fuelio CSV logs.
 * Updates odometer + adds service log entry for the matched vehicle.
 *
 * Fuelio CSV header (semicolon delimited):
 *  Date;Mileage;FuelAmount;FuelCost;FullTank;Note;...
 */
import React, { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import type { Vehicle } from '@/lib/db';

interface FuelioRow {
  date: string;
  mileage: number;
  fuelAmount: number;
  fuelCost: number;
  fullTank: boolean;
  note: string;
}

function parseFuelioCSV(raw: string): FuelioRow[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const rows: FuelioRow[] = [];

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length < 4) continue;
    const mileage = parseFloat(parts[1]?.replace(',', '.'));
    if (isNaN(mileage)) continue; // skip header

    rows.push({
      date:       parts[0] || '',
      mileage,
      fuelAmount: parseFloat(parts[2]?.replace(',', '.')) || 0,
      fuelCost:   parseFloat(parts[3]?.replace(',', '.')) || 0,
      fullTank:   parts[4]?.trim() === '1',
      note:       parts[5] || '',
    });
  }

  return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

interface FuelioImporterProps {
  vehicle: Vehicle;
  onDone: () => void;
}

export function FuelioImporter({ vehicle, onDone }: FuelioImporterProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FuelioRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseFuelioCSV(text);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    try {
      const maxMileage = Math.max(...preview.map(r => r.mileage));
      const lastRow    = preview[preview.length - 1];

      // Build new fuel/service logs
      const fuelLogs = preview.map(r => ({
        date:       r.date,
        odometer:   r.mileage,
        litres:     r.fuelAmount,
        costRs:     r.fuelCost,
        fullTank:   r.fullTank,
        note:       r.note,
      }));

      // Update vehicle: new odometer, append fuel logs
      const existing = vehicle.fuelLogs || [];
      await db.vehicles.update(vehicle.id, {
        odometer: maxMileage,
        fuelLogs: [...existing, ...fuelLogs],
        updatedAt: new Date(),
      });

      toast.success(`Imported ${preview.length} entries. Odometer updated to ${maxMileage.toLocaleString()} km.`);
      setPreview(null);
      setFileName('');
      onDone();
    } catch (err) {
      toast.error('Import failed');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="glass border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          Fuelio CSV Import — {vehicle.make} {vehicle.model}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Semicolon-delimited (.csv) from the Fuelio app
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFile}
        />

        {!preview ? (
          <Button
            variant="outline"
            className="w-full rounded-xl border-dashed h-20 flex-col gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/50"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">Click to select Fuelio CSV file</span>
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-foreground">{fileName}</span>
                <Badge variant="secondary" className="text-[10px]">{preview.length} entries</Badge>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => { setPreview(null); setFileName(''); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Preview table */}
            <div className="rounded-xl border border-border/50 overflow-x-auto max-h-48">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    {['Date', 'Km', 'Litres', '₹Cost', 'Note'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(-10).map((r, i) => (
                    <tr key={i} className="border-t border-border/30">
                      <td className="px-2 py-1 text-foreground">{r.date}</td>
                      <td className="px-2 py-1 font-medium">{r.mileage.toLocaleString()}</td>
                      <td className="px-2 py-1">{r.fuelAmount.toFixed(1)}L</td>
                      <td className="px-2 py-1">₹{r.fuelCost.toFixed(0)}</td>
                      <td className="px-2 py-1 text-muted-foreground truncate max-w-[80px]">{r.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/8 border border-primary/20">
              <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-primary">
                Will update odometer to <strong>{Math.max(...preview.map(r => r.mileage)).toLocaleString()} km</strong> and add {preview.length} fuel entries.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setPreview(null); setFileName(''); }}>Cancel</Button>
              <Button className="flex-1 rounded-xl" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing…' : 'Import Data'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
