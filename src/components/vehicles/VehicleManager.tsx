
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Car, AlertTriangle, Calendar } from 'lucide-react';
import { VehicleService } from '@/services/VehicleService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Vehicle } from '@/db';

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    owner: 'Me' as 'Me' | 'Mother' | 'Grandmother',
    regNo: '',
    type: 'Car' as 'Car' | 'Other' | 'Motorcycle' | 'Scooter' | 'Truck',
    make: '',
    model: '',
    fuelType: 'Petrol' as 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'Hybrid',
    insuranceExpiry: '',
    pucExpiry: '',
    vehicleValue: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const allVehicles = await VehicleService.getVehicles();
      setVehicles(allVehicles);
    } catch (error) {
      toast.error('Failed to load vehicles');
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vehicleData = {
        owner: formData.owner,
        regNo: formData.regNo,
        type: formData.type,
        make: formData.make,
        model: formData.model,
        fuelType: formData.fuelType,
        insuranceExpiry: new Date(formData.insuranceExpiry),
        pucExpiry: new Date(formData.pucExpiry),
        vehicleValue: parseFloat(formData.vehicleValue)
      };

      if (editingVehicle) {
        await VehicleService.updateVehicle(editingVehicle.id, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        await VehicleService.addVehicle(vehicleData);
        toast.success('Vehicle added successfully');
      }

      resetForm();
      setShowAddModal(false);
      setEditingVehicle(null);
      loadVehicles();
    } catch (error) {
      toast.error('Failed to save vehicle');
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      owner: vehicle.owner,
      regNo: vehicle.regNo,
      type: vehicle.type,
      make: vehicle.make || '',
      model: vehicle.model || '',
      fuelType: vehicle.fuelType || 'Petrol',
      insuranceExpiry: vehicle.insuranceExpiry.toISOString().split('T')[0],
      pucExpiry: vehicle.pucExpiry.toISOString().split('T')[0],
      vehicleValue: vehicle.vehicleValue?.toString() || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await VehicleService.deleteVehicle(id);
        toast.success('Vehicle deleted successfully');
        loadVehicles();
      } catch (error) {
        toast.error('Failed to delete vehicle');
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      owner: 'Me',
      regNo: '',
      type: 'Car',
      make: '',
      model: '',
      fuelType: 'Petrol',
      insuranceExpiry: '',
      pucExpiry: '',
      vehicleValue: ''
    });
  };

  const getExpiringVehicles = () => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    return vehicles.filter(vehicle => {
      const insuranceExpiring = new Date(vehicle.insuranceExpiry) <= threeMonthsFromNow;
      const pucExpiring = new Date(vehicle.pucExpiry) <= threeMonthsFromNow;
      return insuranceExpiring || pucExpiring;
    });
  };

  const expiringVehicles = getExpiringVehicles();
  const totalValue = vehicles.reduce((sum, vehicle) => sum + (vehicle.vehicleValue || 0), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading vehicles...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Manager</h1>
          <p className="text-muted-foreground">Track vehicle maintenance, insurance, and documentation</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Expiring Documents Alert */}
      {expiringVehicles.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {expiringVehicles.length} vehicle(s) have documents expiring within 3 months. Please review and renew.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Car className="w-4 h-4" />
            Fleet Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-sm text-muted-foreground">{vehicles.length} vehicles registered</p>
        </CardContent>
      </Card>

      {/* Vehicles List */}
      <div className="grid gap-4">
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No vehicles recorded yet. Add your first vehicle to get started!</p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map((vehicle) => {
            const insuranceDays = Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const pucDays = Math.ceil((new Date(vehicle.pucExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isInsuranceExpiring = insuranceDays <= 90 && insuranceDays > 0;
            const isPucExpiring = pucDays <= 90 && pucDays > 0;

            return (
              <Card key={vehicle.id} className={isInsuranceExpiring || isPucExpiring ? 'border-yellow-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                        <Badge variant="outline">{vehicle.type}</Badge>
                        <Badge variant="secondary">{vehicle.owner}</Badge>
                        {isInsuranceExpiring && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Insurance Expiring</Badge>}
                        {isPucExpiring && <Badge variant="outline" className="text-yellow-600 border-yellow-600">PUC Expiring</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Registration: {vehicle.regNo}</p>
                      <p className="text-sm text-muted-foreground mb-2">Fuel: {vehicle.fuelType}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(vehicle)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(vehicle.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Vehicle Value:</span>
                      <p className="font-medium">{formatCurrency(vehicle.vehicleValue || 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Insurance Expiry:</span>
                      <p className={`font-medium ${isInsuranceExpiring ? 'text-yellow-600' : ''}`}>
                        {vehicle.insuranceExpiry.toLocaleDateString()}
                        {insuranceDays > 0 && (
                          <span className="text-xs block">
                            {insuranceDays} days remaining
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PUC Expiry:</span>
                      <p className={`font-medium ${isPucExpiring ? 'text-yellow-600' : ''}`}>
                        {vehicle.pucExpiry.toLocaleDateString()}
                        {pucDays > 0 && (
                          <span className="text-xs block">
                            {pucDays} days remaining
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Select value={formData.owner} onValueChange={(value: any) => setFormData({...formData, owner: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Me">Me</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Grandmother">Grandmother</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="regNo">Registration Number</Label>
              <Input
                id="regNo"
                value={formData.regNo}
                onChange={(e) => setFormData({...formData, regNo: e.target.value})}
                placeholder="MH01AB1234"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Vehicle Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="Scooter">Scooter</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  placeholder="Honda, Maruti, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  placeholder="City, Swift, etc."
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select value={formData.fuelType} onValueChange={(value: any) => setFormData({...formData, fuelType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="CNG">CNG</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehicleValue">Vehicle Value (₹)</Label>
              <Input
                id="vehicleValue"
                type="number"
                value={formData.vehicleValue}
                onChange={(e) => setFormData({...formData, vehicleValue: e.target.value})}
                placeholder="Current market value"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({...formData, insuranceExpiry: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pucExpiry">PUC Expiry</Label>
                <Input
                  id="pucExpiry"
                  type="date"
                  value={formData.pucExpiry}
                  onChange={(e) => setFormData({...formData, pucExpiry: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddModal(false);
                setEditingVehicle(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingVehicle ? 'Update' : 'Add'} Vehicle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
