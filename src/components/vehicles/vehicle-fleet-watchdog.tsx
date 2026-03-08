import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, CheckCircle, Bike, Upload, 
  Fuel, Wrench, Plus, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import type { Vehicle } from '@/lib/db';
import { formatCurrency } from '@/lib/format-utils';
import Papa from 'papaparse';

// ─── WATCHDOG THRESHOLDS ─────────────────────────────────────────────────────
const WARNING_KM = 1000;
const OVERDUE_KM = 1500;

const OIL_WATCHDOG_VEHICLES = ['FZS', 'Yamaha FZS'];

interface OilStatus {
  status: 'ok' | 'warning' | 'overdue';
  kmSinceService: number;
  lastServiceOdo: number;
  currentOdo: number;
}

function getOilStatus(vehicle: Vehicle): OilStatus {
  const currentOdo = vehicle.odometerReading || vehicle.odometer || 0;
  const lastServiceOdo = vehicle.serviceLogs?.length
    ? Math.max(...vehicle.serviceLogs.map((l: any) => l.odometer || 0))
    : 0;
  const kmSince = currentOdo - lastServiceOdo;

  return {
    status: kmSince >= OVERDUE_KM ? 'overdue' : kmSince >= WARNING_KM ? 'warning' : 'ok',
    kmSinceService: kmSince,
    lastServiceOdo,
    currentOdo,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function VehicleFleetWatchdog() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fuelioDialogOpen, setFuelioDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [odometerInputs, setOdometerInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const all = await db.vehicles.toArray();
      // Remove Xylo (sold)
      const filtered = all.filter(v =>
        !v.name?.toLowerCase().includes('xylo') &&
        !v.model?.toLowerCase().includes('xylo')
      );
      setVehicles(filtered);
    } catch (e) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleOdometerUpdate = async (vehicleId: string) => {
    const val = parseInt(odometerInputs[vehicleId] || '0', 10);
    if (!val || isNaN(val)) return;
    try {
      await db.vehicles.update(vehicleId, {
        odometerReading: val,
        odometer: val,
        updatedAt: new Date(),
      });
      toast.success('Odometer updated');
      loadVehicles();
    } catch (e) {
      toast.error('Failed to update odometer');
    }
  };

  const handleFuelioUpload = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setFuelioDialogOpen(true);
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading fleet...</div>;

  const fzsVehicles = vehicles.filter(v =>
    OIL_WATCHDOG_VEHICLES.some(name =>
      v.name?.toLowerCase().includes(name.toLowerCase()) ||
      v.model?.toLowerCase().includes('fzs')
    )
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bike className="w-5 h-5 text-primary" />
          Vehicle Fleet & Watchdog
        </h2>
        <Badge variant="outline">{vehicles.length} vehicles</Badge>
      </div>

      {/* FZS Oil Watchdog Section */}
      {fzsVehicles.map(vehicle => {
        const oil = getOilStatus(vehicle);
        return (
          <Card
            key={vehicle.id}
          className={`border-2 ${
              oil.status === 'overdue'
                ? 'border-destructive bg-destructive/5'
                : oil.status === 'warning'
                ? 'border-warning bg-warning/5'
                : 'border-success bg-success/5'
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  {vehicle.name || vehicle.model} — Oil Watchdog
                </span>
                {oil.status === 'overdue' && (
                  <Badge variant="destructive" className="animate-pulse">
                    🔴 OIL OVERDUE
                  </Badge>
                )}
                {oil.status === 'warning' && (
                  <Badge className="bg-warning text-warning-foreground">
                    🟠 Service Soon
                  </Badge>
                )}
                {oil.status === 'ok' && (
                  <Badge className="bg-success text-success-foreground">
                    ✅ OK
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-2 rounded-lg bg-background border">
                  <p className="text-muted-foreground text-xs">Current Odo</p>
                  <p className="font-bold">{oil.currentOdo.toLocaleString()} km</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background border">
                  <p className="text-muted-foreground text-xs">Last Service</p>
                  <p className="font-bold">{oil.lastServiceOdo.toLocaleString()} km</p>
                </div>
                <div className={`text-center p-2 rounded-lg border ${
                  oil.status === 'overdue' ? 'bg-destructive/10 border-destructive' :
                  oil.status === 'warning' ? 'bg-warning/10 border-warning' : 'bg-background'
                }`}>
                  <p className="text-muted-foreground text-xs">Since Service</p>
                  <p className="font-bold">{oil.kmSinceService.toLocaleString()} km</p>
                </div>
              </div>

              {/* KM progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0 km</span>
                  <span className="text-warning font-medium">{WARNING_KM} km ⚠️</span>
                  <span className="text-destructive font-medium">{OVERDUE_KM} km 🔴</span>
                </div>
                <Progress
                  value={Math.min(100, (oil.kmSinceService / OVERDUE_KM) * 100)}
                  className={`h-3 ${
                    oil.status === 'overdue' ? '[&>div]:bg-destructive' :
                    oil.status === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-success'
                  }`}
                />
              </div>

              {/* Odometer update */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Update odometer reading"
                  value={odometerInputs[vehicle.id] || ''}
                  onChange={e => setOdometerInputs(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                  className="flex-1 h-8 text-sm"
                />
                <Button size="sm" onClick={() => handleOdometerUpdate(vehicle.id)} className="h-8">
                  Update
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleFuelioUpload(vehicle.id)}
              >
                <Upload className="w-3 h-3 mr-2" />
                Sync Fuelio CSV
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* All Vehicles */}
      <div className="grid gap-3">
        {vehicles.map(vehicle => {
          const isFZS = OIL_WATCHDOG_VEHICLES.some(name =>
            vehicle.name?.toLowerCase().includes(name.toLowerCase()) ||
            vehicle.model?.toLowerCase().includes('fzs')
          );
          if (isFZS) return null; // Already shown above

          const currentOdo = vehicle.odometerReading || vehicle.odometer || 0;
          const insuranceExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
          const daysToInsurance = insuranceExpiry
            ? Math.ceil((insuranceExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{vehicle.name || `${vehicle.make} ${vehicle.model}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.regNo || vehicle.registrationNumber} · {currentOdo.toLocaleString()} km
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFuelioUpload(vehicle.id)}
                      className="h-7 text-xs"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Fuelio
                    </Button>
                    {daysToInsurance !== null && daysToInsurance <= 30 && (
                      <Badge variant="destructive" className="text-xs">
                        Insurance in {daysToInsurance}d
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fuelio CSV Dialog */}
      <FuelioSyncDialog
        open={fuelioDialogOpen}
        vehicleId={selectedVehicleId}
        onClose={() => {
          setFuelioDialogOpen(false);
          setSelectedVehicleId(null);
          loadVehicles();
        }}
      />
    </div>
  );
}

// ─── FUELIO CSV SYNC DIALOG ───────────────────────────────────────────────────

function FuelioSyncDialog({ open, vehicleId, onClose }: {
  open: boolean;
  vehicleId: string | null;
  onClose: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setPreview(result.data.slice(0, 5));
      },
    });
  };

  const handleImport = async () => {
    if (!vehicleId || preview.length === 0) return;
    setProcessing(true);
    try {
      // Find max odometer from Fuelio data
      const maxOdo = preview.reduce((max: number, row: any) => {
        const odo = parseInt(row['Odometer'] || row['odometer'] || '0', 10);
        return Math.max(max, odo);
      }, 0);

      if (maxOdo > 0) {
        await db.vehicles.update(vehicleId, {
          odometerReading: maxOdo,
          odometer: maxOdo,
          updatedAt: new Date(),
        });
        toast.success(`Fuelio sync complete. Odometer updated to ${maxOdo.toLocaleString()} km`);
      } else {
        toast.info('No odometer data found in CSV. Check column names.');
      }
      onClose();
    } catch (e) {
      toast.error('Fuelio import failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Sync Fuelio CSV
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export from the Fuelio app and upload here to update fuel/service logs.
          </p>
          <div>
            <Label>Select Fuelio CSV File</Label>
            <Input type="file" accept=".csv" onChange={handleFileChange} className="mt-1" />
          </div>
          {preview.length > 0 && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                {preview.length}+ records found. Ready to import.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleImport} disabled={processing || preview.length === 0} className="flex-1">
              {processing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
