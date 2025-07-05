import React, { useState } from 'react';
import { VehicleData } from '@/types/jsonPreload';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

interface AddVehicleFormProps {
  onSubmit: (vehicle: Omit<VehicleData, 'id'>) => void;
  onCancel: () => void;
  existingVehicle?: VehicleData | null; // For editing later
}

const vehicleTypeOptions = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

const ownerOptions = [
  { value: 'self', label: 'Self' },
  { value: 'brother', label: 'Brother' },
];

export function AddVehicleForm({ onSubmit, onCancel, existingVehicle = null }: AddVehicleFormProps) {
  const [name, setName] = useState(existingVehicle?.vehicle_name || '');
  const [type, setType] = useState<"car" | "motorcycle">((existingVehicle?.type as "car" | "motorcycle") || 'car');
  const [owner, setOwner] = useState<"self" | "brother" | undefined>((existingVehicle?.owner as "self" | "brother") || undefined);
  const [initialOdometer, setInitialOdometer] = useState<string>('');
  const [currentOdometer, setCurrentOdometer] = useState<string>('');
  const [insuranceProvider, setInsuranceProvider] = useState(existingVehicle?.insurance_provider || '');
  const [insurancePremium, setInsurancePremium] = useState<string>(existingVehicle?.insurance_premium?.toString() || '');
  const [insuranceRenewalDate, setInsuranceRenewalDate] = useState(existingVehicle?.insurance_next_renewal || '');

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      toast({
        title: "Validation Error",
        description: "Vehicle Name and Type are required.",
        variant: "destructive",
      });
      return;
    }

    const vehicleData: Omit<VehicleData, 'id'> = {
      vehicle_name: name,
      type,
      owner: owner || undefined,
      insurance_provider: insuranceProvider || undefined,
      insurance_premium: insurancePremium ? parseFloat(insurancePremium) : undefined,
      insurance_next_renewal: insuranceRenewalDate || undefined,
    };
    onSubmit(vehicleData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
        <CardDescription>
          {existingVehicle ? 'Update the details of your vehicle.' : 'Enter the details of your new vehicle.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicleName">Vehicle Name*</Label>
            <Input
              id="vehicleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Yamaha FZS, Honda City"
              required
            />
          </div>

          <div>
            <Label htmlFor="vehicleType">Type*</Label>
            <Select value={type} onValueChange={(value: "car" | "motorcycle") => setType(value)} required>
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vehicleOwner">Owner</Label>
            <Select value={owner} onValueChange={(value: "self" | "brother") => setOwner(value)}>
              <SelectTrigger id="vehicleOwner">
                <SelectValue placeholder="Select owner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=""><em>None/Not Specified</em></SelectItem>
                {ownerOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialOdometer">Initial Odometer (km)</Label>
              <Input
                id="initialOdometer"
                type="number"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(e.target.value)}
                placeholder="e.g., 15000"
              />
            </div>
            <div>
              <Label htmlFor="currentOdometer">Current Odometer (km)</Label>
              <Input
                id="currentOdometer"
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                placeholder="e.g., 25000"
              />
            </div>
          </div>

          <CardTitle className="text-md pt-2">Insurance Details (Optional)</CardTitle>

          <div>
            <Label htmlFor="insuranceProvider">Insurance Provider</Label>
            <Input
              id="insuranceProvider"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder="e.g., Tata AIG, HDFC Ergo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurancePremium">Premium Amount (₹)</Label>
              <Input
                id="insurancePremium"
                type="number"
                value={insurancePremium}
                onChange={(e) => setInsurancePremium(e.target.value)}
                placeholder="e.g., 2500"
              />
            </div>
            <div>
              <Label htmlFor="insuranceRenewalDate">Renewal Date</Label>
              <Input
                id="insuranceRenewalDate"
                type="date"
                value={insuranceRenewalDate}
                onChange={(e) => setInsuranceRenewalDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {existingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
