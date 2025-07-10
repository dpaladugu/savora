import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Vehicle } from '@/db'; // Vehicle is now DexieVehicleRecord
import { VehicleList } from './VehicleList';
import { AddVehicleForm } from './AddVehicleForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLoadingWrapper } from '@/components/ui/enhanced-loading-wrapper';
import { CriticalErrorBoundary } from '@/components/ui/critical-error-boundary';
import type { VehicleData } from '@/types/jsonPreload'; // For AddVehicleForm's output

export function VehicleManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  // orderBy 'name' as per DexieVehicleRecord, not 'vehicle_name'
  const vehicles = useLiveQuery(async () => {
    return await db.vehicles.orderBy('name').toArray();
  }, [], []);

  const isLoading = vehicles === undefined;

  // vehicleFormData is what comes from AddVehicleForm, based on VehicleData
  const handleAddVehicle = async (vehicleFormData: Omit<VehicleData, 'id'>) => {
    try {
      // Transform VehicleData to DexieVehicleRecord compatible structure
      // registrationNumber is now required by AddVehicleForm
      const vehicleRecord: Omit<Vehicle, 'id'> = {
        name: vehicleFormData.vehicle_name,
        registrationNumber: vehicleFormData.registrationNumber!, // It's required from the form
        // Map other fields from vehicleFormData to Vehicle (DexieVehicleRecord)
        // For now, focusing on the critical ones. Dexie schema v10 includes:
        // make, model, fuelType, insuranceExpiryDate
        // VehicleData has: type, owner, insurance_provider, insurance_premium, insurance_next_renewal
        // This mapping needs to be more comprehensive once AddVehicleForm is updated or
        // DexieVehicleRecord is expanded.
        make: vehicleFormData.make || undefined,
        model: vehicleFormData.model || undefined,
        fuelType: vehicleFormData.fuelType || undefined,
        insuranceExpiryDate: vehicleFormData.insurance_next_renewal || undefined,
        // user_id will be handled by Dexie if not provided and if applicable
      };

      await db.vehicles.add(vehicleRecord as Vehicle);
      toast({ title: "Vehicle Added", description: `${vehicleRecord.name} has been successfully added.` });
      setShowAddForm(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error("Failed to add vehicle:", error);
      toast({
        title: "Error Adding Vehicle",
        description: (error as Error).message || "Could not add vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
      try {
        await db.vehicles.delete(vehicleId);
        toast({ title: "Vehicle Deleted", description: "The vehicle has been successfully deleted." });
      } catch (error) {
        console.error("Failed to delete vehicle:", error);
        toast({
          title: "Error Deleting Vehicle",
          description: (error as Error).message || "Could not delete vehicle. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    // setEditingVehicle(vehicle); // Correct type now
    // setShowAddForm(true);
    // Use vehicle.name as per DexieVehicleRecord
    toast({ title: "Edit Action", description: `Editing ${vehicle.name} (not implemented yet).`});
  };


  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <AddVehicleForm
          onSubmit={handleAddVehicle}
          onCancel={() => {
            setShowAddForm(false);
            setEditingVehicle(null);
          }}
          // existingVehicle expects VehicleData or null.
          // If editingVehicle (Vehicle/DexieVehicleRecord) is to be passed,
          // a transformation or form adaptation is needed.
          // For now, assuming AddVehicleForm will be adapted or this prop is for new vehicles.
          // If editingVehicle is not null, we'd need to map its fields to VehicleData structure.
          existingVehicle={editingVehicle ? {
            // Map DexieVehicleRecord (Vehicle) to VehicleData for the form
            id: typeof editingVehicle.id === 'string' ? undefined : editingVehicle.id, // VehicleData id is number, Dexie id is string
            vehicle_name: editingVehicle.name,
            registrationNumber: editingVehicle.registrationNumber,
            make: editingVehicle.make,
            model: editingVehicle.model,
            fuelType: editingVehicle.fuelType,
            insurance_next_renewal: editingVehicle.insuranceExpiryDate,
            // ... other fields if they exist on Vehicle and are expected by VehicleData
          } : null}
        />
      </CriticalErrorBoundary>
    );
  }

  return (
    <CriticalErrorBoundary>
      <EnhancedLoadingWrapper
        loading={isLoading}
        loadingText="Loading vehicles..."
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-6 h-6 text-primary" aria-hidden="true" />
              <CardTitle>Manage Vehicles</CardTitle>
            </div>
            <Button onClick={() => { setEditingVehicle(null); setShowAddForm(true); }} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </CardHeader>
          <CardContent>
            <VehicleList
              vehicles={vehicles || []} // vehicles are now DexieVehicleRecord[]
              onDelete={handleDeleteVehicle} // Expects string ID
              onEdit={handleEditVehicle} // Expects DexieVehicleRecord
            />
          </CardContent>
        </Card>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
