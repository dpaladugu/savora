
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
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from "@/db";
import type { DexieVehicleRecord } from "@/db";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  purchaseDate: string;
  purchasePrice: number;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  purchaseDate: Date;
  purchasePrice: number;
}

const initialFormData: VehicleFormData = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  purchaseDate: new Date(),
  purchasePrice: 0,
};

export function VehicleManager() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    if (!user) return;

    try {
      const data = await VehicleService.getAll(user.uid);
      const transformedData: Vehicle[] = data.map(vehicle => ({
        id: vehicle.id || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        purchaseDate: vehicle.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: vehicle.purchasePrice || 0,
        user_id: vehicle.user_id || user.uid,
        created_at: new Date(vehicle.created_at || new Date()),
        updated_at: new Date(vehicle.updated_at || new Date())
      }));
      setVehicles(transformedData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const vehicleData = {
        ...formData,
        user_id: user.uid,
        purchaseDate: formData.purchaseDate.toISOString().split('T')[0],
        created_at: new Date(),
        updated_at: new Date(),
        name: `${formData.make} ${formData.model}`,
        registrationNumber: ''
      };

      if (editingId) {
        await VehicleService.update(editingId, {
          ...vehicleData,
          purchaseDate: formData.purchaseDate.toISOString().split('T')[0]
        });
        toast.success('Vehicle updated successfully');
      } else {
        await VehicleService.create(vehicleData);
        toast.success('Vehicle added successfully');
      }

      setFormData(initialFormData);
      setEditingId(null);
      loadVehicles();
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
        year: vehicle.year || new Date().getFullYear(),
        purchaseDate: new Date(vehicle.purchaseDate || new Date()),
        purchasePrice: vehicle.purchasePrice || 0,
      });
      setEditingId(vehicle.id);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await VehicleService.delete(id);
      toast.success('Vehicle deleted successfully');
      loadVehicles();
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
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
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
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
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
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{vehicle.make} {vehicle.model}</h3>
                  <div className="text-sm text-muted-foreground">
                    Year: {vehicle.year}, Purchased on: {format(new Date(vehicle.purchaseDate), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(vehicle.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
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
