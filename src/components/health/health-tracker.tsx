
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Heart, Calendar, AlertTriangle, Activity } from 'lucide-react';
import { HealthService } from '@/services/HealthService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Health, Prescription, Vaccination, Vital } from '@/lib/db-schema-extended';

export function HealthTracker() {
  const [health, setHealth] = useState<Health | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prescriptionForm, setPrescriptionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    medicines: '',
    amount: ''
  });
  const [vitalForm, setVitalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    temperature: '',
    spO2: ''
  });

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const healthData = await HealthService.getHealthProfile();
      setHealth(healthData || null);
    } catch (error) {
      toast.error('Failed to load health data');
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prescription: Prescription = {
        date: new Date(prescriptionForm.date),
        doctor: prescriptionForm.doctor,
        medicines: prescriptionForm.medicines.split(',').map(m => m.trim()),
        amount: parseFloat(prescriptionForm.amount)
      };

      await HealthService.addPrescription(prescription);
      toast.success('Prescription added successfully');
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        date: new Date().toISOString().split('T')[0],
        doctor: '',
        medicines: '',
        amount: ''
      });
      loadHealthData();
    } catch (error) {
      toast.error('Failed to add prescription');
      console.error('Error adding prescription:', error);
    }
  };

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vital: Vital = {
        date: new Date(vitalForm.date),
        bpSystolic: vitalForm.bpSystolic ? parseInt(vitalForm.bpSystolic) : undefined,
        bpDiastolic: vitalForm.bpDiastolic ? parseInt(vitalForm.bpDiastolic) : undefined,
        heartRate: vitalForm.heartRate ? parseInt(vitalForm.heartRate) : undefined,
        temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : undefined,
        spO2: vitalForm.spO2 ? parseInt(vitalForm.spO2) : undefined
      };

      await HealthService.addVitals(vital);
      toast.success('Vital signs recorded successfully');
      setShowVitalModal(false);
      setVitalForm({
        date: new Date().toISOString().split('T')[0],
        bpSystolic: '',
        bpDiastolic: '',
        heartRate: '',
        temperature: '',
        spO2: ''
      });
      loadHealthData();
    } catch (error) {
      toast.error('Failed to record vital signs');
      console.error('Error adding vital signs:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading health data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Health Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Prescriptions, vitals & medical records</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" onClick={() => setShowPrescriptionModal(true)} className="h-9 text-xs gap-1 rounded-xl">
            <Plus className="w-3.5 h-3.5" /> Rx
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowVitalModal(true)} className="h-9 text-xs gap-1 rounded-xl">
            <Activity className="w-3.5 h-3.5" /> Vitals
          </Button>
        </div>
      </div>

      {/* Overview — 3 col compact */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'BMI', value: health?.bmi ? health.bmi.toFixed(1) : '—' },
          { label: 'Prescriptions', value: (health?.prescriptions.length || 0).toString() },
          { label: 'Vital Records', value: (health?.vitals.length || 0).toString() },
        ].map(({ label, value }) => (
          <Card key={label} className="glass">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {!health?.prescriptions.length ? (
            <p className="text-muted-foreground text-center py-8">
              No prescriptions recorded yet. Add your first prescription to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {health.prescriptions.slice(0, 5).map((prescription, index) => (
                <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Dr. {prescription.doctor}</span>
                      <Badge variant="outline">{prescription.date.toLocaleDateString()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prescription.medicines.join(', ')}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(prescription.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          {!health?.vitals.length ? (
            <p className="text-muted-foreground text-center py-8">
              No vital signs recorded yet. Record your first measurements!
            </p>
          ) : (
            <div className="space-y-3">
              {health.vitals.slice(0, 5).map((vital, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{vital.date.toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    {vital.bpSystolic && vital.bpDiastolic && (
                      <div>
                        <span className="text-muted-foreground">BP:</span>
                        <p className="font-medium">{vital.bpSystolic}/{vital.bpDiastolic}</p>
                      </div>
                    )}
                    {vital.heartRate && (
                      <div>
                        <span className="text-muted-foreground">HR:</span>
                        <p className="font-medium">{vital.heartRate} bpm</p>
                      </div>
                    )}
                    {vital.temperature && (
                      <div>
                        <span className="text-muted-foreground">Temp:</span>
                        <p className="font-medium">{vital.temperature}°F</p>
                      </div>
                    )}
                    {vital.spO2 && (
                      <div>
                        <span className="text-muted-foreground">SpO2:</span>
                        <p className="font-medium">{vital.spO2}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Prescription Modal */}
      <Dialog open={showPrescriptionModal} onOpenChange={setShowPrescriptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPrescription} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={prescriptionForm.date}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="doctor">Doctor Name</Label>
              <Input
                id="doctor"
                value={prescriptionForm.doctor}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, doctor: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="medicines">Medicines (comma separated)</Label>
              <Textarea
                id="medicines"
                value={prescriptionForm.medicines}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, medicines: e.target.value})}
                placeholder="Medicine 1, Medicine 2, Medicine 3"
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Total Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={prescriptionForm.amount}
                onChange={(e) => setPrescriptionForm({...prescriptionForm, amount: e.target.value})}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowPrescriptionModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Prescription</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vital Modal */}
      <Dialog open={showVitalModal} onOpenChange={setShowVitalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVital} className="space-y-4">
            <div>
              <Label htmlFor="vitalDate">Date</Label>
              <Input
                id="vitalDate"
                type="date"
                value={vitalForm.date}
                onChange={(e) => setVitalForm({...vitalForm, date: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bpSystolic">BP Systolic</Label>
                <Input
                  id="bpSystolic"
                  type="number"
                  value={vitalForm.bpSystolic}
                  onChange={(e) => setVitalForm({...vitalForm, bpSystolic: e.target.value})}
                  placeholder="120"
                />
              </div>
              <div>
                <Label htmlFor="bpDiastolic">BP Diastolic</Label>
                <Input
                  id="bpDiastolic"
                  type="number"
                  value={vitalForm.bpDiastolic}
                  onChange={(e) => setVitalForm({...vitalForm, bpDiastolic: e.target.value})}
                  placeholder="80"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heartRate">Heart Rate</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={vitalForm.heartRate}
                  onChange={(e) => setVitalForm({...vitalForm, heartRate: e.target.value})}
                  placeholder="72"
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={vitalForm.temperature}
                  onChange={(e) => setVitalForm({...vitalForm, temperature: e.target.value})}
                  placeholder="98.6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="spO2">Blood Oxygen (SpO2)</Label>
              <Input
                id="spO2"
                type="number"
                value={vitalForm.spO2}
                onChange={(e) => setVitalForm({...vitalForm, spO2: e.target.value})}
                placeholder="98"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowVitalModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Vitals</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
