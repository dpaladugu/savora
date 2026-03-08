

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Car, AlertTriangle, Flame, Wrench, Upload } from 'lucide-react';
import { VehicleService } from '@/services/VehicleService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Vehicle } from '@/db';
import { PageHeader } from '@/components/layout/page-header';
import { FuelioImporter } from './FuelioImporter';

// FZS oil change watchdog thresholds
const FZS_WARN_KM   = 1000;
const FZS_OVERDUE_KM = 1500;

function OilAlert({ vehicle }: { vehicle: Vehicle }) {
  const lastService = vehicle.serviceLogs?.length
    ? vehicle.serviceLogs[vehicle.serviceLogs.length - 1]
    : null;
  const kmSince = lastService ? (vehicle.odometer || 0) - (lastService.odometer || 0) : 0;

  const isFZS = (vehicle.model || '').toLowerCase().includes('fzs') ||
                (vehicle.make  || '').toLowerCase().includes('fzs');
  if (!isFZS || !lastService) return null;

  if (kmSince >= FZS_OVERDUE_KM) {
    return (
      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30">
        <Flame className="h-3.5 w-3.5 text-destructive shrink-0" />
        <span className="text-xs font-semibold text-destructive">OIL OVERDUE · {kmSince.toLocaleString()} km since last change</span>
      </div>
    );
  }
  if (kmSince >= FZS_WARN_KM) {
    return (
      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/30">
        <Wrench className="h-3.5 w-3.5 text-warning shrink-0" />
        <span className="text-xs font-semibold text-warning">Oil Change Due · {kmSince.toLocaleString()} km since last change</span>
      </div>
    );
  }
  return null;
}

const emptyForm = {
  owner: 'Me' as 'Me' | 'Mother' | 'Grandmother',
  regNo: '', type: 'Car' as 'Car' | 'Other' | 'Motorcycle' | 'Scooter' | 'Truck',
  make: '', model: '',
  fuelType: 'Petrol' as 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'Hybrid',
  purchaseDate: '', insuranceExpiry: '', pucExpiry: '', odometer: '', vehicleValue: '',
};

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [fuelioTarget, setFuelioTarget] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'import'>('fleet');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); setVehicles(await VehicleService.getVehicles()); }
    catch { toast.error('Failed to load vehicles'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        owner: form.owner, regNo: form.regNo, type: form.type,
        make: form.make, model: form.model, fuelType: form.fuelType,
        purchaseDate: new Date(form.purchaseDate),
        insuranceExpiry: new Date(form.insuranceExpiry),
        pucExpiry: new Date(form.pucExpiry),
        odometer: parseFloat(form.odometer) || 0,
        fuelEfficiency: 0,
        vehicleValue: parseFloat(form.vehicleValue) || 0,
        fuelLogs: [], serviceLogs: [], claims: [], treadDepthMM: 0,
      };
      if (editingVehicle) {
        await VehicleService.updateVehicle(editingVehicle.id, data);
        toast.success('Vehicle updated');
      } else {
        await VehicleService.addVehicle(data);
        toast.success('Vehicle added');
      }
      setForm({ ...emptyForm }); setShowModal(false); setEditingVehicle(null); load();
    } catch { toast.error('Failed to save vehicle'); }
  };

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      owner: v.owner, regNo: v.regNo, type: v.type,
      make: v.make || '', model: v.model || '',
      fuelType: v.fuelType || 'Petrol',
      purchaseDate: v.purchaseDate.toISOString().split('T')[0],
      insuranceExpiry: v.insuranceExpiry.toISOString().split('T')[0],
      pucExpiry: v.pucExpiry.toISOString().split('T')[0],
      odometer: v.odometer?.toString() || '0',
      vehicleValue: v.vehicleValue?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try { await VehicleService.deleteVehicle(id); toast.success('Vehicle deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const expiringCount = vehicles.filter(v => {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    return new Date(v.insuranceExpiry) <= d || new Date(v.pucExpiry) <= d;
  }).length;

  const totalValue = vehicles.reduce((s, v) => s + (v.vehicleValue || 0), 0);

  if (loading) return <div className="space-y-3 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Watchdog"
        subtitle="Fleet maintenance, insurance and FZS oil alerts"
        icon={Car}
        action={
          <Button size="sm" onClick={() => setShowModal(true)} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {expiringCount > 0 && (
        <Alert className="border-warning/30 bg-warning/8">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-xs">
            {expiringCount} vehicle{expiringCount > 1 ? 's' : ''} — documents expiring within 3 months
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <Card className="glass">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-muted-foreground">Fleet Value</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </div>
          <Badge variant="secondary" className="text-xs">{vehicles.length} vehicles</Badge>
        </CardContent>
      </Card>

      {/* Vehicle Cards */}
      <div className="space-y-3">
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <Car className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No vehicles yet. Add your first.</p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map(v => {
            const insDay = Math.ceil((new Date(v.insuranceExpiry).getTime() - Date.now()) / 86400000);
            const pucDay = Math.ceil((new Date(v.pucExpiry).getTime() - Date.now()) / 86400000);
            const insWarn = insDay <= 90 && insDay > 0;
            const pucWarn = pucDay <= 90 && pucDay > 0;
            return (
              <Card key={v.id} className={`glass ${insWarn || pucWarn ? 'border-warning/40' : ''}`}>
                <CardContent className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-semibold text-sm text-foreground">{v.make} {v.model}</span>
                        <Badge variant="outline" className="text-xs">{v.type}</Badge>
                        <Badge variant="secondary" className="text-xs">{v.owner}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.regNo} · {v.fuelType}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => handleEdit(v)} aria-label="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(v.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  {/* FZS oil watchdog */}
                  <OilAlert vehicle={v} />

                  {/* Details grid — 2 col on all sizes */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-medium">{formatCurrency(v.vehicleValue || 0)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <p className="text-muted-foreground">Odometer</p>
                      <p className="font-medium">{(v.odometer || 0).toLocaleString()} km</p>
                    </div>
                    <div className={`p-2 rounded-lg ${insWarn ? 'bg-warning/10' : 'bg-muted/40'}`}>
                      <p className="text-muted-foreground">Insurance</p>
                      <p className={`font-medium ${insWarn ? 'text-warning' : ''}`}>
                        {v.insuranceExpiry.toLocaleDateString()}{insWarn && <span className="block text-[10px]">{insDay}d left</span>}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${pucWarn ? 'bg-warning/10' : 'bg-muted/40'}`}>
                      <p className="text-muted-foreground">PUC</p>
                      <p className={`font-medium ${pucWarn ? 'text-warning' : ''}`}>
                        {v.pucExpiry.toLocaleDateString()}{pucWarn && <span className="block text-[10px]">{pucDay}d left</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {/* Fuelio Import Dialog */}
      {fuelioTarget && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <FuelioImporter vehicle={fuelioTarget} onDone={() => { setFuelioTarget(null); load(); }} />
            <Button variant="ghost" size="sm" className="w-full mt-2 rounded-xl text-muted-foreground" onClick={() => setFuelioTarget(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
      <Dialog open={showModal} onOpenChange={(o) => { setShowModal(o); if (!o) { setEditingVehicle(null); setForm({ ...emptyForm }); } }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Select value={form.owner} onValueChange={(v: any) => setForm({ ...form, owner: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Me">Me</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Grandmother">Grandmother</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Registration No.</Label>
              <Input value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} placeholder="AP05AB1234" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Make</Label>
                <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Yamaha" required />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="FZS" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v: any) => setForm({ ...form, fuelType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Petrol','Diesel','Electric','CNG','Hybrid'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Odometer (km)</Label>
                <Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} placeholder="0" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Insurance Expiry</Label>
                <Input type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>PUC Expiry</Label>
                <Input type="date" value={form.pucExpiry} onChange={(e) => setForm({ ...form, pucExpiry: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Value (₹)</Label>
              <Input type="number" value={form.vehicleValue} onChange={(e) => setForm({ ...form, vehicleValue: e.target.value })} placeholder="Current market value" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingVehicle(null); setForm({ ...emptyForm }); }}>Cancel</Button>
              <Button type="submit" className="flex-1">{editingVehicle ? 'Update' : 'Add'} Vehicle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
