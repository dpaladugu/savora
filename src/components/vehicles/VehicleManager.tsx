
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Car, Calendar, AlertTriangle, Fuel } from 'lucide-react';
import { VehicleService } from '@/services/VehicleService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { Vehicle } from '@/lib/db';

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Car' as 'Car' | 'Bike' | 'Scooter' | 'Truck' | 'Other',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    registrationNumber: '',
    purchasePrice: '',
    currentValue: '',
    fuelType: 'Petrol' as 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid',
    insuranceExpiryDate: '',
    pucExpiryDate: '',
    registrationExpiryDate: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const allVehicles = await VehicleService.getAllVehicles();
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
        type: formData.type,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        registrationNumber: formData.registrationNumber,
        purchasePrice: parseFloat(formData.purchasePrice),
        currentValue: parseFloat(formData.currentValue),
        fuelType: formData.fuelType,
        insuranceExpiryDate: formData.insuranceExpiryDate ? new Date(formData.insuranceExpiryDate) : undefined,
        pucExpiryDate: formData.pucExpiryDate ? new Date(formData.pucExpiryDate) : undefined,
        registrationExpiryDate: formData.registrationExpiryDate ? new Date(formData.registrationExpiryDate) : undefined
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
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      registrationNumber: vehicle.registrationNumber,
      purchasePrice: vehicle.purchasePrice.toString(),
      currentValue: vehicle.currentValue.toString(),
      fuelType: vehicle.fuelType,
      insuranceExpiryDate: vehicle.insuranceExpiryDate?.toISOString().split('T')[0] || '',
      pucExpiryDate: vehicle.pucExpiryDate?.toISOString().split('T')[0] || '',
      registrationExpiryDate: vehicle.registrationExpiryDate?.toISOString().split('T')[0] || ''
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
      type: 'Car',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      registrationNumber: '',
      purchasePrice: '',
      currentValue: '',
      fuelType: 'Petrol',
      insuranceExpiryDate: '',
      pucExpiryDate: '',
      registrationExpiryDate: ''
    });
  };

  const getExpiringDocuments = () => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const expiring = [];
    
    vehicles.forEach(vehicle => {
      if (vehicle.insuranceExpiryDate && new Date(vehicle.insuranceExpiryDate) <= threeMonthsFromNow) {
        expiring.push({ vehicle, document: 'Insurance', date: vehicle.insuranceExpiryDate });
      }
      if (vehicle.pucExpiryDate && new Date(vehicle.pucExpiryDate) <= threeMonthsFromNow) {
        expiring.push({ vehicle, document: 'PUC', date: vehicle.pucExpiryDate });
      }
      if (vehicle.registrationExpiryDate && new Date(vehicle.registrationExpiryDate) <= threeMonthsFromNow) {
        expiring.push({ vehicle, document: 'Registration', date: vehicle.registrationExpiryDate });
      }
    });
    
    return expiring;
  };

  const totalValue = vehicles.reduce((sum, vehicle) => sum + vehicle.currentValue, 0);
  const totalPurchasePrice = vehicles.reduce((sum, vehicle) => sum + vehicle.purchasePrice, 0);
  const expiringDocuments = getExpiringDocuments();

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading vehicles...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Manager</h1>
          <p className="text-muted-foreground">Manage your vehicles and track document renewals</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocuments.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {expiringDocuments.length} document(s) expiring within 3 months. Please review and renew.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="w-4 h-4" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchasePrice)}</div>
          </CardContent>
        </Card>
      </div>

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
            const hasExpiringDocs = expiringDocuments.some(exp => exp.vehicle.id === vehicle.id);

            return (
              <Card key={vehicle.id} className={hasExpiringDocs ? 'border-yellow-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                        <Badge variant="outline">{vehicle.type}</Badge>
                        <Badge variant="secondary">{vehicle.year}</Badge>
                        {hasExpiringDocs && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Documents Expiring</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{vehicle.registrationNumber}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Fuel className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{vehicle.fuelType}</span>
                      </div>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Purchase Price:</span>
                      <p className="font-medium">{formatCurrency(vehicle.purchasePrice)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Value:</span>
                      <p className="font-medium">{formatCurrency(vehicle.currentValue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Insurance Expiry:</span>
                      <p className="font-medium">{vehicle.insuranceExpiryDate?.toLocaleDateString() || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PUC Expiry:</span>
                      <p className="font-medium">{vehicle.pucExpiryDate?.toLocaleDateString() || 'Not set'}</p>
                    </div>
                  </div>

                  {/* Expiring Documents for this vehicle */}
                  {hasExpiringDocs && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Expiring Documents:</p>
                      {expiringDocuments
                        .filter(exp => exp.vehicle.id === vehicle.id)
                        .map((exp, index) => (
                          <p key={index} className="text-xs text-yellow-700">
                            {exp.document}: {exp.date.toLocaleDateString()}
                          </p>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Vehicle Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Scooter">Scooter</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="CNG">CNG</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  placeholder="e.g., Maruti, Honda"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  placeholder="e.g., Swift, City"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  placeholder="e.g., MH12AB1234"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currentValue">Current Value (₹)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="insuranceExpiryDate">Insurance Expiry</Label>
                <Input
                  id="insuranceExpiryDate"
                  type="date"
                  value={formData.insuranceExpiryDate}
                  onChange={(e) => setFormData({...formData, insuranceExpiryDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="pucExpiryDate">PUC Expiry</Label>
                <Input
                  id="pucExpiryDate"
                  type="date"
                  value={formData.pucExpiryDate}
                  onChange={(e) => setFormData({...formData, pucExpiryDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="registrationExpiryDate">Registration Expiry</Label>
                <Input
                  id="registrationExpiryDate"
                  type="date"
                  value={formData.registrationExpiryDate}
                  onChange={(e) => setFormData({...formData, registrationExpiryDate: e.target.value})}
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
