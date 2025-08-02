
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Plus, Edit, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VehicleService } from "@/services/VehicleService";
import { useAuth } from "@/services/auth-service";
import { db, Vehicle } from "@/db";
import { useLiveQuery } from 'dexie-react-hooks';

interface VehicleFormData {
  make: string;
  model: string;
  type: 'Car' | 'Motorcycle' | 'Scooter' | 'Truck' | 'Other';
  purchaseDate: Date;
  owner: string;
  regNo: string;
  odometer: number;
  fuelEfficiency: number;
  insuranceExpiry: Date;
  pucExpiry: Date;
}

const initialFormData: VehicleFormData = {
  make: '',
  model: '',
  type: 'Car',
  purchaseDate: new Date(),
  owner: 'Me',
  regNo: '',
  odometer: 0,
  fuelEfficiency: 15,
  insuranceExpiry: new Date(),
  pucExpiry: new Date(),
};

export function VehicleManager() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const vehicleData: Omit<Vehicle, 'id'> = {
        ...formData,
        fuelLogs: [],
        serviceLogs: [],
        claims: [],
        treadDepthMM: 5.0,
      };

      if (editingId) {
        await VehicleService.update(editingId, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        await VehicleService.create(vehicleData);
        toast.success('Vehicle added successfully');
      }

      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    const vehicle = await VehicleService.getVehicleById(id);
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        type: vehicle.type || 'Car',
        purchaseDate: vehicle.purchaseDate || new Date(),
        owner: vehicle.owner || 'Me',
        regNo: vehicle.regNo || '',
        odometer: vehicle.odometer || 0,
        fuelEfficiency: vehicle.fuelEfficiency || 15,
        insuranceExpiry: vehicle.insuranceExpiry || new Date(),
        pucExpiry: vehicle.pucExpiry || new Date(),
      });
      setEditingId(vehicle.id);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await VehicleService.delete(id);
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'Car' | 'Motorcycle' | 'Scooter' | 'Truck' | 'Other') => 
                    setFormData({ ...formData, type: value })
                  }
                >
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

              <div className="space-y-2">
                <Label htmlFor="regNo">Registration Number</Label>
                <Input
                  id="regNo"
                  value={formData.regNo}
                  onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.purchaseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.purchaseDate ? format(formData.purchaseDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.purchaseDate}
                      onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData(initialFormData);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicles?.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                  <div className="text-sm text-muted-foreground">
                    Type: {vehicle.type}, Registration: {vehicle.regNo}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(vehicle.id!)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!vehicles?.length && (
              <div className="text-center py-8 text-muted-foreground">
                No vehicles found. Add your first vehicle to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
