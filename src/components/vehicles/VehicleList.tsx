import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2, Edit3, ShieldCheck, Gauge, UserCircle, CalendarDays, Car, Bike, ChevronDown, Shield, Receipt, Package,
  Palette, Tag as StatusTag, ShoppingCart, Cog, Route, MapPin, Wrench, FileText, ClockHistory, TrendingUp
} from "lucide-react";
import { Vehicle } from "@/db";
import { formatCurrency } from "@/lib/format-utils"; // Import from new utility file
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Separator } from '@/components/ui/separator';

interface VehicleListProps {
  vehicles: Vehicle[];
  onDelete?: (vehicleId: string) => void;
  onEdit?: (vehicle: Vehicle) => void;
}

const mockInsurancePolicies: Record<string, Array<{id: string, insurer: string, premium: number, expiryDate: string}>> = {};
const mockRelatedExpenses: Record<string, Array<{id: string, tag: string, amount: number}>> = {};

// Local formatCurrency helper removed, will use DataValidator.formatCurrency

export function VehicleList({ vehicles, onDelete, onEdit }: VehicleListProps) {
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car aria-hidden="true" className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vehicles found.</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first vehicle to get started.</p>
        </CardContent>
      </Card>
    );
  }

  const isDateInPast = (dateStr?: string): boolean => {
    if (!dateStr || !isValid(parseISO(dateStr))) return false;
    return parseISO(dateStr) < new Date();
  };

  const isDateApproaching = (dateStr?: string, days: number = 30): boolean => {
    if (!dateStr || !isValid(parseISO(dateStr))) return false;
    const targetDate = parseISO(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0); // Compare date parts only
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
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

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-200 text-gray-700';
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sold': return 'bg-gray-400 text-white dark:bg-gray-600';
      case 'in repair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'out of service': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const VehicleIcon = ({type}: {type?: string}) => {
    if (type?.toLowerCase() === 'motorcycle' || type?.toLowerCase() === 'scooter') {
      return <Bike aria-hidden="true" className="w-6 h-6 text-primary" />;
    }
    return <Car aria-hidden="true" className="w-6 h-6 text-primary" />;
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
        <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4 bg-muted/30 dark:bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VehicleIcon type={vehicle.type} />
                <CardTitle className="text-lg font-semibold">
                  {vehicle.name}
                </CardTitle>
                {vehicle.status && (
                  <Badge variant="outline" className={`${getStatusColor(vehicle.status)} text-xs border-none`}>{vehicle.status}</Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {onEdit && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(vehicle)} className="text-muted-foreground hover:text-primary h-8 w-8" aria-label={`Edit ${vehicle.name}`}>
                    <Edit3 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(vehicle.id!)} className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label={`Delete ${vehicle.name}`}>
                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {vehicle.registrationNumber && <p className="text-sm text-muted-foreground mt-1 font-mono tracking-wider">{vehicle.registrationNumber}</p>}
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {vehicle.make && vehicle.model && (
                <div className="flex items-center text-muted-foreground"><Package aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Make/Model: <span className="text-foreground ml-1">{vehicle.make} {vehicle.model}</span></div>
              )}
              {vehicle.year && (
                <div className="flex items-center text-muted-foreground"><CalendarDays aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Year: <span className="text-foreground ml-1">{vehicle.year}</span></div>
              )}
              {vehicle.color && (
                <div className="flex items-center text-muted-foreground"><Palette aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Color: <span className="text-foreground ml-1">{vehicle.color}</span></div>
              )}
              {vehicle.owner && (
                <div className="flex items-center text-muted-foreground"><UserCircle aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Owner: <span className="text-foreground ml-1">{vehicle.owner}</span></div>
              )}
              {vehicle.fuelType && (
                <div className="flex items-center text-muted-foreground">
                  <TrendingUp aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Fuel: <Badge variant="outline" className={`${getFuelTypeColor(vehicle.fuelType)} border-none text-xs ml-1`}>{vehicle.fuelType}</Badge>
                </div>
              )}
              {vehicle.currentOdometer !== undefined && (
                <div className="flex items-center text-muted-foreground"><Gauge aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Odometer: <span className="text-foreground ml-1">{vehicle.currentOdometer.toLocaleString()} km</span></div>
              )}
              {vehicle.fuelEfficiency && (
                <div className="flex items-center text-muted-foreground"><Route aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Efficiency: <span className="text-foreground ml-1">{vehicle.fuelEfficiency}</span></div>
              )}
              {vehicle.purchaseDate && (
                <div className="flex items-center text-muted-foreground"><ShoppingCart aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Purchased: <span className="text-foreground ml-1">{isValid(parseISO(vehicle.purchaseDate)) ? format(parseISO(vehicle.purchaseDate), 'PPP') : 'N/A'}</span></div>
              )}
               {vehicle.purchasePrice !== undefined && (
                <div className="flex items-center text-muted-foreground"><ShoppingCart aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Price: <span className="text-foreground ml-1">{formatCurrency(vehicle.purchasePrice)}</span></div>
              )}
            </div>

            <Separator className="my-3"/>

            <CardDescription className="text-xs font-semibold mb-1">Insurance & Compliance</CardDescription>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {vehicle.insuranceProvider && (
                <div className="flex items-center text-muted-foreground"><ShieldCheck aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Insurer: <span className="text-foreground ml-1">{vehicle.insuranceProvider}</span></div>
              )}
              {vehicle.insurancePolicyNumber && (
                <div className="flex items-center text-muted-foreground"><FileText aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Policy#: <span className="text-foreground ml-1">{vehicle.insurancePolicyNumber}</span></div>
              )}
              {vehicle.insurance_premium !== undefined && (
                <div className="flex items-center text-muted-foreground"><ShieldCheck aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Premium: <span className="text-foreground ml-1">{formatCurrency(vehicle.insurance_premium)} {vehicle.insurance_frequency && `(${vehicle.insurance_frequency})`}</span></div>
              )}
              {vehicle.insuranceExpiryDate && (
                <div className={`flex items-center text-muted-foreground ${isDateApproaching(vehicle.insuranceExpiryDate) ? 'font-semibold text-orange-600 dark:text-orange-400' : ''} ${isDateInPast(vehicle.insuranceExpiryDate) ? 'text-red-600 dark:text-red-400' : ''}`}>
                    <CalendarDays aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />
                    Ins. Due: <span className="ml-1">{isValid(parseISO(vehicle.insuranceExpiryDate)) ? format(parseISO(vehicle.insuranceExpiryDate), 'PPP') : 'N/A'}</span>
                    {isDateApproaching(vehicle.insuranceExpiryDate) && !isDateInPast(vehicle.insuranceExpiryDate) && <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-600">Soon</Badge>}
                    {isDateInPast(vehicle.insuranceExpiryDate) && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                </div>
              )}
              {vehicle.next_pollution_check && (
                 <div className={`flex items-center text-muted-foreground ${isDateApproaching(vehicle.next_pollution_check) ? 'font-semibold text-orange-600 dark:text-orange-400' : ''} ${isDateInPast(vehicle.next_pollution_check) ? 'text-red-600 dark:text-red-400' : ''}`}>
                    <Cog aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />
                    PUCC Due: <span className="ml-1">{isValid(parseISO(vehicle.next_pollution_check)) ? format(parseISO(vehicle.next_pollution_check), 'PPP') : 'N/A'}</span>
                    {isDateApproaching(vehicle.next_pollution_check) && !isDateInPast(vehicle.next_pollution_check) && <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-600">Soon</Badge>}
                    {isDateInPast(vehicle.next_pollution_check) && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                </div>
              )}
            </div>

            {(vehicle.tracking_type || vehicle.location || vehicle.tracking_last_service_odometer !== undefined || vehicle.repair_estimate !== undefined || vehicle.engineNumber || vehicle.chassisNumber || vehicle.notes ) && <Separator className="my-3"/>}

            {(vehicle.tracking_type || vehicle.location || vehicle.tracking_last_service_odometer !== undefined || vehicle.repair_estimate !== undefined) &&
                <CardDescription className="text-xs font-semibold mb-1">Tracking & Service</CardDescription>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {vehicle.tracking_type && (
                <div className="flex items-center text-muted-foreground"><StatusTag aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Tracking: <span className="text-foreground ml-1">{vehicle.tracking_type}</span></div>
              )}
              {vehicle.location && (
                <div className="flex items-center text-muted-foreground"><MapPin aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Location: <span className="text-foreground ml-1">{vehicle.location}</span></div>
              )}
              {vehicle.tracking_last_service_odometer !== undefined && (
                <div className="flex items-center text-muted-foreground"><ClockHistory aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Last Serviced: <span className="text-foreground ml-1">{vehicle.tracking_last_service_odometer.toLocaleString()} km</span></div>
              )}
              {vehicle.repair_estimate !== undefined && vehicle.repair_estimate > 0 && (
                <div className="flex items-center text-muted-foreground"><Wrench aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Repair Est: <span className="text-foreground ml-1">{formatCurrency(vehicle.repair_estimate)}</span></div>
              )}
            </div>

            {(vehicle.engineNumber || vehicle.chassisNumber) && <Separator className="my-3"/>}
            {(vehicle.engineNumber || vehicle.chassisNumber) &&
                <CardDescription className="text-xs font-semibold mb-1">Identifiers</CardDescription>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {vehicle.engineNumber && (
                    <div className="flex items-center text-muted-foreground"><Cog aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Engine#: <span className="text-foreground ml-1 font-mono text-xs">{vehicle.engineNumber}</span></div>
                )}
                {vehicle.chassisNumber && (
                    <div className="flex items-center text-muted-foreground"><Package aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Chassis#: <span className="text-foreground ml-1 font-mono text-xs">{vehicle.chassisNumber}</span></div>
                )}
            </div>

            {vehicle.notes && <Separator className="my-3"/> }
            {vehicle.notes && (
              <div>
                <CardDescription className="text-xs font-semibold mb-1">Notes</CardDescription>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{vehicle.notes}</p>
              </div>
            )}

            {/* Collapsible Section for Mock Data (Future Enhancement) */}
            <div className="mt-3 pt-3 border-t border-dashed">
              <Collapsible open={expandedVehicleId === vehicle.id} onOpenChange={(open) => setExpandedVehicleId(open ? vehicle.id! : null)}>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="h-8 p-1 w-full justify-start text-xs text-primary hover:bg-muted/50">
                    Show Related Data (e.g., Expenses, Maintenance - Mock)
                    <ChevronDown aria-hidden="true" className={`w-3 h-3 ml-auto transform transition-transform ${expandedVehicleId === vehicle.id ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 text-xs pl-2">
                  {(mockInsurancePolicies[vehicle.id!] && mockInsurancePolicies[vehicle.id!].length > 0) ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield aria-hidden="true" className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Linked Insurance Policies (Mock)</span>
                      </div>
                       <p className="text-muted-foreground italic text-xs">Mock policy display needs review.</p>
                    </div>
                  ) : <p className="text-muted-foreground italic text-xs">No linked insurance policies (mock).</p>}

                  {(mockRelatedExpenses[vehicle.id!] && mockRelatedExpenses[vehicle.id!].length > 0) ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Receipt aria-hidden="true" className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-800 dark:text-green-200">Linked Expenses (Mock)</span>
                      </div>
                        <p className="text-muted-foreground italic text-xs">Mock expense display needs review.</p>
                      </div>
                  ) : <p className="text-muted-foreground italic text-xs">No linked expenses (mock).</p>}
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
