
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2, Edit3, ShieldCheck, Gauge, UserCircle, CalendarDays, Car, Bike, ChevronDown, Shield, Receipt, Package,
  Palette, Tag as StatusTag, ShoppingCart, Cog, Route, MapPin, Wrench, FileText, History, TrendingUp
} from "lucide-react";
import { Vehicle } from "@/db";
import { formatCurrency } from "@/lib/format-utils";
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

  const isDateInPast = (date?: Date): boolean => {
    if (!date || !(date instanceof Date)) return false;
    return date < new Date();
  };

  const isDateApproaching = (date?: Date, days: number = 30): boolean => {
    if (!date || !(date instanceof Date)) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  };

  const VehicleIcon = ({type}: {type?: string}) => {
    if (type?.toLowerCase() === 'motorcycle' || type?.toLowerCase() === 'scooter') {
      return <Bike aria-hidden="true" className="w-6 h-6 text-primary" />;
    }
    return <Car aria-hidden="true" className="w-6 h-6 text-primary" />;
  };

  const formatDateSafe = (date?: Date): string => {
    if (!date || !(date instanceof Date)) return 'N/A';
    return format(date, 'PPP');
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
                  {vehicle.make} {vehicle.model}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-1">
                {onEdit && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(vehicle)} className="text-muted-foreground hover:text-primary h-8 w-8" aria-label={`Edit ${vehicle.make} ${vehicle.model}`}>
                    <Edit3 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && vehicle.id && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(vehicle.id!)} className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label={`Delete ${vehicle.make} ${vehicle.model}`}>
                    <Trash2 aria-hidden="true" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {vehicle.regNo && <p className="text-sm text-muted-foreground mt-1 font-mono tracking-wider">{vehicle.regNo}</p>}
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {vehicle.make && vehicle.model && (
                <div className="flex items-center text-muted-foreground"><Package aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Make/Model: <span className="text-foreground ml-1">{vehicle.make} {vehicle.model}</span></div>
              )}
              {vehicle.type && (
                <div className="flex items-center text-muted-foreground"><Car aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Type: <span className="text-foreground ml-1">{vehicle.type}</span></div>
              )}
              {vehicle.owner && (
                <div className="flex items-center text-muted-foreground"><UserCircle aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Owner: <span className="text-foreground ml-1">{vehicle.owner}</span></div>
              )}
              {vehicle.odometer !== undefined && (
                <div className="flex items-center text-muted-foreground"><Gauge aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Odometer: <span className="text-foreground ml-1">{vehicle.odometer.toLocaleString()} km</span></div>
              )}
              {vehicle.fuelEfficiency && (
                <div className="flex items-center text-muted-foreground"><Route aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Efficiency: <span className="text-foreground ml-1">{vehicle.fuelEfficiency} km/l</span></div>
              )}
              {vehicle.purchaseDate && (
                <div className="flex items-center text-muted-foreground"><ShoppingCart aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />Purchased: <span className="text-foreground ml-1">{formatDateSafe(vehicle.purchaseDate)}</span></div>
              )}
            </div>

            <Separator className="my-3"/>

            <CardDescription className="text-xs font-semibold mb-1">Insurance & Compliance</CardDescription>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              {vehicle.insuranceExpiry && (
                <div className={`flex items-center text-muted-foreground ${isDateApproaching(vehicle.insuranceExpiry) ? 'font-semibold text-orange-600 dark:text-orange-400' : ''} ${isDateInPast(vehicle.insuranceExpiry) ? 'text-red-600 dark:text-red-400' : ''}`}>
                    <CalendarDays aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />
                    Ins. Due: <span className="ml-1">{formatDateSafe(vehicle.insuranceExpiry)}</span>
                    {isDateApproaching(vehicle.insuranceExpiry) && !isDateInPast(vehicle.insuranceExpiry) && <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-600">Soon</Badge>}
                    {isDateInPast(vehicle.insuranceExpiry) && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                </div>
              )}
              {vehicle.pucExpiry && (
                 <div className={`flex items-center text-muted-foreground ${isDateApproaching(vehicle.pucExpiry) ? 'font-semibold text-orange-600 dark:text-orange-400' : ''} ${isDateInPast(vehicle.pucExpiry) ? 'text-red-600 dark:text-red-400' : ''}`}>
                    <Cog aria-hidden="true" className="w-4 h-4 mr-1.5 text-gray-400" />
                    PUCC Due: <span className="ml-1">{formatDateSafe(vehicle.pucExpiry)}</span>
                    {isDateApproaching(vehicle.pucExpiry) && !isDateInPast(vehicle.pucExpiry) && <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-600">Soon</Badge>}
                    {isDateInPast(vehicle.pucExpiry) && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
                </div>
              )}
            </div>

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
