import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Vehicle } from '@/db';
import { VehicleList } from './VehicleList';
import { AddVehicleForm } from './AddVehicleForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLoadingWrapper } from '@/components/ui/enhanced-loading-wrapper'; // Assuming this exists
import { CriticalErrorBoundary } from '@/components/ui/critical-error-boundary'; // Assuming this exists

export function VehicleManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null); // For future edit functionality
  const { toast } = useToast();

  const vehicles = useLiveQuery(async () => {
    return await db.vehicles.orderBy('vehicle_name').toArray();
  }, [], []); // Initial empty array

  const isLoading = vehicles === undefined;

  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
      await db.vehicles.add(vehicleData);
      toast({ title: "Vehicle Added", description: `${vehicleData.vehicle_name} has been successfully added.` });
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

  const handleDeleteVehicle = async (vehicleId: number) => {
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

  // Placeholder for edit functionality
  const handleEditVehicle = (vehicle: Vehicle) => {
    // setEditingVehicle(vehicle);
    // setShowAddForm(true);
    toast({ title: "Edit Action", description: `Editing ${vehicle.vehicle_name} (not implemented yet).`});
  };


  if (showAddForm) {
    return (
      <CriticalErrorBoundary>
        <AddVehicleForm
          onSubmit={handleAddVehicle} // Will handle both add and update later
          onCancel={() => {
            setShowAddForm(false);
            setEditingVehicle(null);
          }}
          existingVehicle={editingVehicle}
        />
      </CriticalErrorBoundary>
    );
  }

  return (
    <CriticalErrorBoundary>
      <EnhancedLoadingWrapper
        loading={isLoading}
        loadingText="Loading vehicles..."
        // error={dbError} // Dexie errors might need different handling than single query errors
        // onRetry={reloadVehicles} // useLiveQuery handles retries/updates
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-6 h-6 text-primary" />
              <CardTitle>Manage Vehicles</CardTitle>
            </div>
            <Button onClick={() => { setEditingVehicle(null); setShowAddForm(true); }} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </CardHeader>
          <CardContent>
            <VehicleList
              vehicles={vehicles || []}
              onDelete={handleDeleteVehicle}
              onEdit={handleEditVehicle} // Pass edit handler
            />
          </CardContent>
        </Card>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
