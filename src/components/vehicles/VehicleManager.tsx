import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Vehicle } from '@/db'; // Vehicle is now DexieVehicleRecord
import { VehicleList } from './VehicleList';
import { AddVehicleForm } from './AddVehicleForm';
import { Button } from '@/components/ui/button';
import { VehicleService } from '@/services/VehicleService'; // Import the new service
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLoadingWrapper } from '@/components/ui/enhanced-loading-wrapper';
import { CriticalErrorBoundary } from '@/components/ui/critical-error-boundary';
import type { VehicleData } from '@/types/jsonPreload';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

export function VehicleManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // orderBy 'name' and filter by user_id if user is available
  const vehicles = useLiveQuery(() => {
    if (!user?.uid) return [];
    // The service method returns the promise that useLiveQuery needs.
    // We can add sorting here after getting the data if the service doesn't handle it.
    return VehicleService.getVehicles(user.uid).then(data => data.sort((a, b) => a.name.localeCompare(b.name)));
  }, [user?.uid], []);

  const isLoading = vehicles === undefined && user !== undefined;

  // vehicleFormData is what comes from AddVehicleForm, based on VehicleData
  const handleAddVehicle = async (vehicleFormData: Omit<VehicleData, 'id'>) => {
    if (!user?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a vehicle.", variant: "destructive" });
      return;
    }
    try {
      const vehicleRecord: Omit<Vehicle, 'id' | 'user_id'> & { user_id?: string } = { // Ensure user_id is part of the type for the record
        // Core Identification
        name: vehicleFormData.vehicle_name,
        registrationNumber: vehicleFormData.registrationNumber!,
        make: vehicleFormData.make,
        model: vehicleFormData.model,
        year: vehicleFormData.year,
        color: vehicleFormData.color,
        type: vehicleFormData.type,
        owner: vehicleFormData.owner,
        status: vehicleFormData.status,

        // Purchase and Financials
        purchaseDate: vehicleFormData.purchaseDate,
        purchasePrice: vehicleFormData.purchasePrice,

        // Technical Details
        fuelType: vehicleFormData.fuelType,
        engineNumber: vehicleFormData.engineNumber,
        chassisNumber: vehicleFormData.chassisNumber,
        currentOdometer: vehicleFormData.currentOdometer,
        fuelEfficiency: vehicleFormData.fuelEfficiency,

        // Insurance Details
        insuranceProvider: vehicleFormData.insurance_provider,
        insurancePolicyNumber: vehicleFormData.insurancePolicyNumber,
        insuranceExpiryDate: vehicleFormData.insurance_next_renewal,
        insurance_premium: vehicleFormData.insurance_premium,
        insurance_frequency: vehicleFormData.insurance_frequency,

        // Tracking & Maintenance
        tracking_type: vehicleFormData.tracking_type,
        tracking_last_service_odometer: vehicleFormData.tracking_last_service_odometer,
        next_pollution_check: vehicleFormData.next_pollution_check,
        location: vehicleFormData.location,
        repair_estimate: vehicleFormData.repair_estimate,

        // Misc
        notes: vehicleFormData.notes,
      };

      const recordToSave: Partial<Vehicle> = { ...vehicleRecord, user_id: user.uid };

      if (editingVehicle && editingVehicle.id) {
        // The service handles adding the 'updated_at' timestamp.
        await VehicleService.updateVehicle(editingVehicle.id, recordToSave);
        toast({ title: "Vehicle Updated", description: `${recordToSave.name} has been successfully updated.` });
      } else {
        // The service handles adding 'id', 'created_at', and 'updated_at'.
        await VehicleService.addVehicle(recordToSave as Omit<Vehicle, 'id'>);
        toast({ title: "Vehicle Added", description: `${recordToSave.name} has been successfully added.` });
      }

      setShowAddForm(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error("Failed to add/update vehicle:", error);
      toast({
        title: `Error ${editingVehicle ? 'Updating' : 'Adding'} Vehicle`,
        description: (error as Error).message || `Could not ${editingVehicle ? 'update' : 'add'} vehicle. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const vehicleToDelete = vehicles?.find(v => v.id === vehicleId);
    const vehicleName = vehicleToDelete?.name || "this vehicle";
    if (window.confirm(`Are you sure you want to delete ${vehicleName}? This action cannot be undone.`)) {
      try {
        await VehicleService.deleteVehicle(vehicleId);
        toast({ title: "Vehicle Deleted", description: `${vehicleName} has been successfully deleted.` });
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
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleAddNewVehicle = () => {
    setEditingVehicle(null);
    setShowAddForm(true);
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
          existingVehicle={editingVehicle ? {
            // Map DexieVehicleRecord (Vehicle) to VehicleData for the form
            // id is not part of VehicleData for form purposes beyond existing check
            vehicle_name: editingVehicle.name,
            registrationNumber: editingVehicle.registrationNumber,
            make: editingVehicle.make,
            model: editingVehicle.model,
            year: editingVehicle.year,
            color: editingVehicle.color,
            type: editingVehicle.type,
            owner: editingVehicle.owner,
            status: editingVehicle.status,
            purchaseDate: editingVehicle.purchaseDate,
            purchasePrice: editingVehicle.purchasePrice,
            fuelType: editingVehicle.fuelType,
            engineNumber: editingVehicle.engineNumber,
            chassisNumber: editingVehicle.chassisNumber,
            currentOdometer: editingVehicle.currentOdometer,
            fuelEfficiency: editingVehicle.fuelEfficiency,
            insurance_provider: editingVehicle.insuranceProvider,
            insurancePolicyNumber: editingVehicle.insurancePolicyNumber,
            insurance_next_renewal: editingVehicle.insuranceExpiryDate, // Map to form field
            insurance_premium: editingVehicle.insurance_premium,
            insurance_frequency: editingVehicle.insurance_frequency,
            tracking_type: editingVehicle.tracking_type,
            tracking_last_service_odometer: editingVehicle.tracking_last_service_odometer,
            next_pollution_check: editingVehicle.next_pollution_check,
            location: editingVehicle.location,
            repair_estimate: editingVehicle.repair_estimate,
            notes: editingVehicle.notes,
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
            <Button onClick={handleAddNewVehicle} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </CardHeader>
          <CardContent>
            <VehicleList
              vehicles={vehicles || []}
              onDelete={handleDeleteVehicle}
              onEdit={handleEditVehicle}
            />
          </CardContent>
        </Card>
      </EnhancedLoadingWrapper>
    </CriticalErrorBoundary>
  );
}
