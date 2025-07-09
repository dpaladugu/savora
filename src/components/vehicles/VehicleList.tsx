import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, ShieldCheck, Gauge, UserCircle, Tag, CalendarDays, Car, Bike } from "lucide-react";
import { Vehicle } from "@/db"; // Use Vehicle type from db.ts
import { DataValidator } from "@/services/data-validator"; // For currency formatting

interface VehicleListProps {
  vehicles: Vehicle[];
  onDelete?: (vehicleId: number) => void;
  onEdit?: (vehicle: Vehicle) => void; // Optional: For future edit functionality
}

export function VehicleList({ vehicles, onDelete, onEdit }: VehicleListProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No vehicles found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first vehicle to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="hover:shadow-lg transition-shadow duration-200 ease-in-out">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                {vehicle.type === 'car' ? <Car className="w-5 h-5 mr-2 text-primary" aria-hidden="true" /> : <Bike className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />}
                {vehicle.vehicle_name}
              </CardTitle>
              <div className="flex items-center space-x-1">
                {onEdit && vehicle.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(vehicle)}
                    className="text-muted-foreground hover:text-primary"
                    aria-label={`Edit ${vehicle.vehicle_name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && vehicle.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(vehicle.id!)}
                    className="text-destructive hover:text-destructive/80"
                    aria-label={`Delete ${vehicle.vehicle_name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            {vehicle.owner && (
              <div className="flex items-center text-muted-foreground">
                <UserCircle className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
                Owner: <span className="text-foreground ml-1">{vehicle.owner}</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <Tag className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
              Type: <span className="text-foreground ml-1 capitalize">{vehicle.type}</span>
            </div>
            {vehicle.insurance_provider && (
              <div className="flex items-center text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
                Insurance: <span className="text-foreground ml-1">{vehicle.insurance_provider}</span>
              </div>
            )}
            {vehicle.insurance_premium !== undefined && (
              <div className="flex items-center text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
                Premium: <span className="text-foreground ml-1">{DataValidator.formatCurrency(vehicle.insurance_premium)}</span>
              </div>
            )}
            {vehicle.insurance_next_renewal && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
                Renewal: <span className="text-foreground ml-1">{DataValidator.formatDate(vehicle.insurance_next_renewal)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
