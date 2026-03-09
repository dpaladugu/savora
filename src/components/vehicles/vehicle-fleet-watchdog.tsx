/**
 * VehicleFleetWatchdog — useLiveQuery for real-time updates,
 * service log entry modal, next service date, Fuelio CSV import.
 */
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Vehicle } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertTriangle, CheckCircle, Bike, Upload,
  Fuel, Wrench, Plus, TrendingUp, Calendar, Edit
} from 'lucide-react';
import Papa from 'papaparse';

// ─── WATCHDOG THRESHOLDS ─────────────────────────────────────────────────────
const OIL_WARNING_KM = 800;
const OIL_OVERDUE_KM = 1200;
const SERVICE_INTERVAL_KM = 3000;

interface ServiceLogEntry {
  id: string;
  date: string;
  odometer: number;
  type: 'Oil Change' | 'Full Service' | 'Tyre' | 'Repair' | 'Other';
  cost: number;
  notes?: string;
}

interface OilStatus {
  status: 'ok' | 'warning' | 'overdue';
  kmSinceService: number;
  lastServiceOdo: number;
  currentOdo: number;
}

function getOilStatus(vehicle: Vehicle): OilStatus {
  const currentOdo = vehicle.odometerReading || vehicle.odometer || 0;
  const logs: ServiceLogEntry[] = Array.isArray(vehicle.serviceLogs) ? vehicle.serviceLogs : [];
  const oilLogs = logs.filter(l => l.type === 'Oil Change' || l.type === 'Full Service');
  const lastServiceOdo = oilLogs.length
    ? Math.max(...oilLogs.map(l => l.odometer || 0))
    : 0;
  const kmSince = currentOdo - lastServiceOdo;
  return {
    status: kmSince >= OIL_OVERDUE_KM ? 'overdue' : kmSince >= OIL_WARNING_KM ? 'warning' : 'ok',
    kmSinceService: kmSince,
    lastServiceOdo,
    currentOdo,
  };
}

// ─── Service Log Modal ────────────────────────────────────────────────────────
function ServiceLogModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: String(vehicle.odometerReading || vehicle.odometer || ''),
    type: 'Oil Change' as ServiceLogEntry['type'],
    cost: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const existing: ServiceLogEntry[] = Array.isArray(vehicle.serviceLogs) ? vehicle.serviceLogs : [];

  const handleSave = async () => {
    const odo = parseInt(form.odometer);
    if (!odo || odo <= 0) { toast.error('Enter valid odometer reading'); return; }
    setSaving(true);
    try {
      const entry: ServiceLogEntry = {
        id: crypto.randomUUID(),
        date: form.date,
        odometer: odo,
        type: form.type,
        cost: parseFloat(form.cost) || 0,
        notes: form.notes,
      };
      const updated = [...existing, entry];
      await db.vehicles.update(vehicle.id, {
        serviceLogs: updated,
        odometerReading: odo,
        odometer: odo,
        updatedAt: new Date(),
      });
      toast.success(`${form.type} logged at ${odo.toLocaleString('en-IN')} km`);
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" />
            Log Service — {vehicle.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Type</Label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {['Oil Change', 'Full Service', 'Tyre', 'Repair', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Odometer (km) *</Label>
              <Input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} placeholder="e.g. 12500" className="h-9 text-sm" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cost (₹)</Label>
              <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="1200" className="h-9 text-sm" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="h-9 text-sm" />
            </div>
          </div>

          {/* Recent log */}
          {existing.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recent Logs</p>
              {[...existing].reverse().slice(0, 3).map(l => (
                <div key={l.id} className="flex justify-between text-xs text-muted-foreground border-b border-border/30 py-1">
                  <span>{l.type} · {new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="tabular-nums">{l.odometer.toLocaleString('en-IN')} km{l.cost ? ` · ₹${l.cost.toLocaleString('en-IN')}` : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-9 text-xs" onClick={handleSave} disabled={saving}>Save Log</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Odometer quick-update ────────────────────────────────────────────────────
function OdometerUpdate({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [val, setVal] = useState(String(vehicle.odometerReading || vehicle.odometer || ''));

  const handleSave = async () => {
    const n = parseInt(val);
    if (!n || isNaN(n)) { toast.error('Enter a valid reading'); return; }
    await db.vehicles.update(vehicle.id, { odometerReading: n, odometer: n, updatedAt: new Date() });
    toast.success('Odometer updated');
    onClose();
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xs mx-4">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Bike className="h-4 w-4 text-primary" /> Update Odometer — {vehicle.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Current Reading (km)</Label>
            <Input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="12500" className="h-10 text-base font-bold" autoFocus />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-9 text-xs" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 h-9 text-xs" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function VehicleFleetWatchdog() {
  const vehicles = useLiveQuery(
    () => db.vehicles.toArray().then(all =>
      all.filter(v =>
        !v.name?.toLowerCase().includes('xylo') &&
        !v.model?.toLowerCase().includes('xylo')
      )
    ).catch(() => []),
    []
  ) ?? [];

  const [serviceLogVehicle, setServiceLogVehicle] = useState<Vehicle | null>(null);
  const [odometerVehicle, setOdometerVehicle] = useState<Vehicle | null>(null);
  const [fuelioDialogOpen, setFuelioDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Derived oil statuses
  const statuses = useMemo(() => {
    return vehicles.map(v => ({ ...v, oil: getOilStatus(v) }));
  }, [vehicles]);

  const overdueCount = statuses.filter(v => v.oil.status === 'overdue').length;
  const warningCount = statuses.filter(v => v.oil.status === 'warning').length;

  // Fuelio CSV import
  const handleFuelioImport = async (vehicleId: string, file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (!vehicle) return;
          const existing: ServiceLogEntry[] = Array.isArray(vehicle.serviceLogs) ? vehicle.serviceLogs : [];
          const newEntries = rows.map((r, i) => ({
            id: crypto.randomUUID(),
            date: r['Date'] || r['date'] || new Date().toISOString().split('T')[0],
            odometer: parseInt(r['Odometer'] || r['odo'] || '0') || 0,
            type: 'Oil Change' as const,
            cost: parseFloat(r['Price'] || r['cost'] || '0') || 0,
            notes: r['Note'] || '',
          }));
          const maxOdo = Math.max(...newEntries.map(e => e.odometer), vehicle.odometerReading || 0);
          await db.vehicles.update(vehicleId, {
            serviceLogs: [...existing, ...newEntries],
            odometerReading: maxOdo,
            odometer: maxOdo,
            updatedAt: new Date(),
          });
          toast.success(`Imported ${newEntries.length} Fuelio entries`);
          setFuelioDialogOpen(false);
        } catch { toast.error('Import failed'); }
      },
      error: () => toast.error('Failed to parse CSV'),
    });
  };

  const statusConfig = {
    ok:      { color: 'text-success',     bg: 'bg-success/10',     border: 'border-success/30',     icon: CheckCircle, label: 'OK' },
    warning: { color: 'text-warning',     bg: 'bg-warning/10',     border: 'border-warning/30',     icon: AlertTriangle, label: 'Due Soon' },
    overdue: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: AlertTriangle, label: 'Overdue' },
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Fleet"
        subtitle={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
        icon={Bike}
        action={
          <Button
            size="sm" variant="outline"
            className="h-9 gap-1.5 rounded-xl text-xs"
            onClick={() => { setSelectedVehicleId(vehicles[0]?.id ?? null); setFuelioDialogOpen(true); }}
          >
            <Upload className="h-3.5 w-3.5" /> Fuelio
          </Button>
        }
      />

      {/* Alert strips */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-destructive/40 bg-destructive/5 text-xs">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">{overdueCount} vehicle(s) need oil change NOW</span>
        </div>
      )}
      {warningCount > 0 && overdueCount === 0 && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-warning/40 bg-warning/5 text-xs">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-warning font-medium">{warningCount} vehicle(s) approaching oil change limit</span>
        </div>
      )}

      {/* Vehicle cards */}
      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bike className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">No vehicles registered</p>
            <p className="text-xs text-muted-foreground mt-1">Vehicles are seeded automatically on first launch</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {statuses.map(vehicle => {
            const cfg = statusConfig[vehicle.oil.status];
            const Icon = cfg.icon;
            const kmPct = Math.min(100, (vehicle.oil.kmSinceService / OIL_OVERDUE_KM) * 100);
            const serviceLogs: ServiceLogEntry[] = Array.isArray(vehicle.serviceLogs) ? vehicle.serviceLogs : [];
            const lastService = [...serviceLogs].reverse()[0];

            // Insurance and PUC expiry
            const insExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
            const pucExpiry = vehicle.pucExpiry ? new Date(vehicle.pucExpiry) : null;
            const insDay = insExpiry ? Math.ceil((insExpiry.getTime() - Date.now()) / 86400000) : null;
            const pucDay = pucExpiry ? Math.ceil((pucExpiry.getTime() - Date.now()) / 86400000) : null;

            return (
              <Card key={vehicle.id} className={`glass border ${cfg.border}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                        <Bike className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{vehicle.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.model} {vehicle.year && `· ${vehicle.year}`}
                          {vehicle.registrationNumber ? ` · ${vehicle.registrationNumber}` : vehicle.regNo ? ` · ${vehicle.regNo}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border ${cfg.border} shrink-0`}>
                      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
                    </Badge>
                  </div>

                  {/* Oil change bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Oil Change</span>
                      <span className={`font-medium tabular-nums ${cfg.color}`}>
                        {vehicle.oil.kmSinceService.toLocaleString('en-IN')} km since last service
                      </span>
                    </div>
                    <Progress
                      value={kmPct}
                      className={`h-2 ${vehicle.oil.status === 'overdue' ? '[&>div]:bg-destructive' : vehicle.oil.status === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Last: {vehicle.oil.lastServiceOdo.toLocaleString('en-IN')} km</span>
                      <span>Current: {vehicle.oil.currentOdo.toLocaleString('en-IN')} km</span>
                    </div>
                  </div>

                  {/* Expiry badges */}
                  <div className="flex gap-2 flex-wrap">
                    {insDay !== null && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${insDay <= 30 ? 'bg-warning/10 text-warning border-warning/30' : 'bg-muted text-muted-foreground border-border/40'}`}>
                        Insurance: {insDay > 0 ? `${insDay}d left` : 'Expired'}
                      </span>
                    )}
                    {pucDay !== null && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pucDay <= 30 ? 'bg-warning/10 text-warning border-warning/30' : 'bg-muted text-muted-foreground border-border/40'}`}>
                        PUC: {pucDay > 0 ? `${pucDay}d left` : 'Expired'}
                      </span>
                    )}
                    {lastService && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                        Last: {lastService.type} · {new Date(lastService.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {lastService.cost ? ` · ₹${lastService.cost.toLocaleString('en-IN')}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="outline"
                      className={`flex-1 h-8 text-xs gap-1 rounded-xl ${vehicle.oil.status !== 'ok' ? 'border-primary/30 text-primary hover:bg-primary/5' : ''}`}
                      onClick={() => setServiceLogVehicle(vehicle as Vehicle)}
                    >
                      <Wrench className="h-3 w-3" /> Log Service
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="flex-1 h-8 text-xs gap-1 rounded-xl"
                      onClick={() => setOdometerVehicle(vehicle as Vehicle)}
                    >
                      <Edit className="h-3 w-3" /> Update Odo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Service Log Modal */}
      {serviceLogVehicle && (
        <ServiceLogModal vehicle={serviceLogVehicle} onClose={() => setServiceLogVehicle(null)} />
      )}

      {/* Odometer Modal */}
      {odometerVehicle && (
        <OdometerUpdate vehicle={odometerVehicle} onClose={() => setOdometerVehicle(null)} />
      )}

      {/* Fuelio Import Dialog */}
      <Dialog open={fuelioDialogOpen} onOpenChange={setFuelioDialogOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" /> Import Fuelio CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Vehicle</Label>
              <select
                value={selectedVehicleId ?? ''}
                onChange={e => setSelectedVehicleId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fuelio CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && selectedVehicleId) handleFuelioImport(selectedVehicleId, file);
                }}
                className="h-9 text-xs"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Export from Fuelio app → Backup → Export to CSV. Columns: Date, Odometer, Price.
            </p>
            <Button variant="outline" className="w-full h-9 text-xs" onClick={() => setFuelioDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
