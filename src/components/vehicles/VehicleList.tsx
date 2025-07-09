import React, { useState } from 'react'; // Added useState
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, ShieldCheck, Gauge, UserCircle, Tag, CalendarDays, Car, Bike, ChevronDown, Shield, Receipt } from "lucide-react"; // Added ChevronDown, Shield, Receipt
import { Vehicle } from "@/db";
import { DataValidator } from "@/services/data-validator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Added Collapsible
import { motion } from "framer-motion"; // For item animation
import { format, parseISO, isValid } from 'date-fns'; // For date formatting

interface VehicleListProps {
  vehicles: Vehicle[];
  onDelete?: (vehicleId: string) => void; // Changed to string for UUID
  onEdit?: (vehicle: Vehicle) => void;
}

// Mock data (to be replaced with actual data fetching later)
const mockInsurancePolicies: Record<string, Array<{id: string, insurer: string, premium: number, expiryDate: string}>> = {
  // "vehicle_id_1": [{ id: "ins1", insurer: "Tata AIG", premium: 12000, expiryDate: "2025-01-01" }],
};
const mockRelatedExpenses: Record<string, Array<{id: string, tag: string, amount: number}>> = {
  // "vehicle_id_1": [{ id: "exp1", tag: "Fuel", amount: 3000 }, { id: "exp2", tag: "Service", amount: 5000 }],
};


export function VehicleList({ vehicles, onDelete, onEdit }: VehicleListProps) {
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car aria-hidden="true" className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vehicles found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first vehicle to get started.</p>
        </CardContent>
      </Card>
    );
  }

  const isInsuranceExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate || !isValid(parseISO(expiryDate))) return false;
    const expiry = parseISO(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0; // Ensure it's not already past
  };

  const getFuelTypeColor = (fuelType?: string) => {
    if (!fuelType) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const colors: Record<string, string> = {
      'Petrol': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Diesel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Electric': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'CNG': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Hybrid': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    return colors[fuelType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };


  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
        <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {vehicle.type === 'car' ? <Car aria-hidden="true" className="w-6 h-6 text-primary" /> : <Bike aria-hidden="true" className="w-6 h-6 text-primary" />}
                <CardTitle className="text-lg font-semibold">
                  {vehicle.vehicle_name}
                </CardTitle>
                 {vehicle.fuelType && (
                    <Badge variant="outline" className={`${getFuelTypeColor(vehicle.fuelType)} border-none`}>
                        {vehicle.fuelType}
                    </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {onEdit && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(vehicle)} className="text-muted-foreground hover:text-primary h-8 w-8" aria-label={`Edit ${vehicle.vehicle_name}`}>
                    <Edit3 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(vehicle.id!)} className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label={`Delete ${vehicle.vehicle_name}`}>
                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
             {vehicle.registrationNumber && <p className="text-xs text-muted-foreground mt-1">{vehicle.registrationNumber}</p>}
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
              {vehicle.make && vehicle.model && (
                <div className="flex items-center text-muted-foreground"><Car aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Make/Model: <span className="text-foreground ml-1">{vehicle.make} {vehicle.model}</span></div>
              )}
              {vehicle.year && (
                <div className="flex items-center text-muted-foreground"><CalendarDays aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Year: <span className="text-foreground ml-1">{vehicle.year}</span></div>
              )}
              {vehicle.mileage !== undefined && (
                <div className="flex items-center text-muted-foreground"><Gauge aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Mileage: <span className="text-foreground ml-1">{vehicle.mileage} {vehicle.fuelType === 'Electric' ? 'km/charge' : 'km/l'}</span></div>
              )}
              {vehicle.owner && (
                <div className="flex items-center text-muted-foreground"><UserCircle aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Owner: <span className="text-foreground ml-1">{vehicle.owner}</span></div>
              )}
              {vehicle.insurance_provider && (
                <div className="flex items-center text-muted-foreground"><ShieldCheck aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Insurer: <span className="text-foreground ml-1">{vehicle.insurance_provider}</span></div>
              )}
              {vehicle.insurance_premium !== undefined && (
                <div className="flex items-center text-muted-foreground"><ShieldCheck aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />Premium: <span className="text-foreground ml-1">{DataValidator.formatCurrency(vehicle.insurance_premium)}</span></div>
              )}
              {vehicle.insurance_next_renewal && (
                <div className={`flex items-center text-muted-foreground ${isInsuranceExpiringSoon(vehicle.insurance_next_renewal) ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}`}>
                    <CalendarDays aria-hidden="true" className="w-4 h-4 mr-2 text-gray-400" />
                    Renewal: <span className="ml-1">{isValid(parseISO(vehicle.insurance_next_renewal)) ? format(parseISO(vehicle.insurance_next_renewal), 'PPP') : 'N/A'}</span>
                    {isInsuranceExpiringSoon(vehicle.insurance_next_renewal) && <Badge variant="destructive" className="ml-2 text-xs">Expiring Soon</Badge>}
                </div>
              )}
            </div>

            {/* Related Data Collapsible Section */}
            <div className="mt-3 pt-2 border-t border-dashed">
              <Collapsible open={expandedVehicleId === vehicle.id} onOpenChange={(open) => setExpandedVehicleId(open ? vehicle.id : null)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 p-2 w-full justify-start text-xs text-muted-foreground hover:bg-muted/50">
                    View Related Data
                    <ChevronDown aria-hidden="true" className={`w-3 h-3 ml-auto transform transition-transform ${expandedVehicleId === vehicle.id ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3 text-xs pl-2">
                  {/* Related Insurance (Mock) */}
                  {(mockInsurancePolicies[vehicle.id!] && mockInsurancePolicies[vehicle.id!].length > 0) ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield aria-hidden="true" className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Insurance Policies</span>
                      </div>
                      {mockInsurancePolicies[vehicle.id!]?.map(policy => (
                        <div key={policy.id} className="text-blue-700 dark:text-blue-300">
                          {policy.insurer} - {DataValidator.formatCurrency(policy.premium)} (Exp: {format(parseISO(policy.expiryDate), 'PP')})
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground italic">No linked insurance policies (mock).</p>}

                  {/* Recent Expenses (Mock) */}
                  {(mockRelatedExpenses[vehicle.id!] && mockRelatedExpenses[vehicle.id!].length > 0) ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt aria-hidden="true" className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-800 dark:text-green-200">Recent Expenses</span>
                      </div>
                      <div className="space-y-0.5">
                        {mockRelatedExpenses[vehicle.id!]?.slice(0, 3).map(expense => (
                          <div key={expense.id} className="text-green-700 dark:text-green-300 flex justify-between">
                            <span>{expense.tag}</span>
                            <span>{DataValidator.formatCurrency(expense.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-muted-foreground italic">No linked expenses (mock).</p>}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      ))}
    </div>
  );
}
