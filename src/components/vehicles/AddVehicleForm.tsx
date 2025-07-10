import React, { useState, useEffect } from 'react';
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
  existingVehicle?: VehicleData | null;
}

const vehicleTypeOptions = [ // General type (Car/Motorcycle)
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other' },
];

const fuelTypeOptions = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'Electric' },
  { value: 'CNG', label: 'CNG' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Other', label: 'Other' },
];

const ownerOptions = [
  { value: 'self', label: 'Self' },
  { value: 'brother', label: 'Brother' },
  // Add other relevant owner types
];

export function AddVehicleForm({ onSubmit, onCancel, existingVehicle = null }: AddVehicleFormProps) {
  const [vehicleName, setVehicleName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string>('car'); // General type like car/motorcycle
  const [owner, setOwner] = useState<string | undefined>(undefined);

  const [formErrors, setFormErrors] = useState<{ vehicleName?: string; registrationNumber?: string; type?: string }>({});

  // Optional fields from original form
  const [initialOdometer, setInitialOdometer] = useState<string>('');
  const [currentOdometer, setCurrentOdometer] = useState<string>('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePremium, setInsurancePremium] = useState<string>('');
  const [insuranceRenewalDate, setInsuranceRenewalDate] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (existingVehicle) {
      setVehicleName(existingVehicle.vehicle_name || '');
      setRegistrationNumber(existingVehicle.registrationNumber || '');
      setMake(existingVehicle.make || '');
      setModel(existingVehicle.model || '');
      setFuelType(existingVehicle.fuelType || undefined);
      setType(existingVehicle.type || 'car');
      setOwner(existingVehicle.owner || undefined);
      setInsuranceProvider(existingVehicle.insurance_provider || '');
      setInsurancePremium(existingVehicle.insurance_premium?.toString() || '');
      setInsuranceRenewalDate(existingVehicle.insurance_next_renewal || '');
      // Initialize other fields like odometer if they are part of VehicleData and form
    } else {
      // Reset form for new entry
      setVehicleName('');
      setRegistrationNumber('');
      setMake('');
      setModel('');
      setFuelType(undefined);
      setType('car');
      setOwner(undefined);
      setInsuranceProvider('');
      setInsurancePremium('');
      setInsuranceRenewalDate('');
      setInitialOdometer('');
      setCurrentOdometer('');
    }
  }, [existingVehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { vehicleName?: string; registrationNumber?: string; type?: string } = {};
    if (!vehicleName.trim()) {
      errors.vehicleName = "Vehicle Name is required.";
    }
    if (!registrationNumber.trim()) {
      errors.registrationNumber = "Registration Number is required.";
    }
    if (!type) {
      errors.type = "Vehicle Type is required.";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    const vehicleDataToSubmit: Omit<VehicleData, 'id'> = {
      vehicle_name: vehicleName,
      registrationNumber: registrationNumber.toUpperCase(), // Standardize to uppercase
      make: make || undefined,
      model: model || undefined,
      fuelType: fuelType || undefined,
      type, // General type
      owner: owner || undefined,
      insurance_provider: insuranceProvider || undefined,
      insurance_premium: insurancePremium ? parseFloat(insurancePremium) : undefined,
      insurance_next_renewal: insuranceRenewalDate || undefined,
      // Include other fields like odometer if they are part of VehicleData
    };
    onSubmit(vehicleDataToSubmit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
        <CardDescription>
          {existingVehicle ? 'Update the details of your vehicle.' : 'Enter the details for your new vehicle.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Name */}
          <div>
            <Label htmlFor="vehicleName">Vehicle Name*</Label>
            <Input
              id="vehicleName"
              value={vehicleName}
              onChange={(e) => {
                setVehicleName(e.target.value);
                if (formErrors.vehicleName) setFormErrors(prev => ({ ...prev, vehicleName: undefined }));
              }}
              placeholder="e.g., My Honda City, Dad's Scooter"
              required
              aria-invalid={!!formErrors.vehicleName}
              aria-describedby={formErrors.vehicleName ? "vehicleName-error" : undefined}
            />
            {formErrors.vehicleName && <p id="vehicleName-error" className="mt-1 text-xs text-red-600">{formErrors.vehicleName}</p>}
          </div>

          {/* Registration Number */}
          <div>
            <Label htmlFor="registrationNumber">Registration Number*</Label>
            <Input
              id="registrationNumber"
              value={registrationNumber}
              onChange={(e) => {
                setRegistrationNumber(e.target.value);
                if (formErrors.registrationNumber) setFormErrors(prev => ({ ...prev, registrationNumber: undefined }));
              }}
              placeholder="e.g., MH12AB1234"
              required
              aria-invalid={!!formErrors.registrationNumber}
              aria-describedby={formErrors.registrationNumber ? "registrationNumber-error" : undefined}
            />
            {formErrors.registrationNumber && <p id="registrationNumber-error" className="mt-1 text-xs text-red-600">{formErrors.registrationNumber}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make */}
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g., Honda, Maruti, Bajaj"
              />
            </div>
            {/* Model */}
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., City, Swift, Pulsar"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fuel Type */}
            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select value={fuelType} onValueChange={(value) => setFuelType(value)}>
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""><em>None/Not Specified</em></SelectItem>
                  {fuelTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* General Vehicle Type (Car/Motorcycle) */}
            <div>
              <Label htmlFor="vehicleType">Type*</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value);
                  if (formErrors.type) setFormErrors(prev => ({ ...prev, type: undefined }));
                }}
                required
              >
                <SelectTrigger
                  id="vehicleType"
                  aria-invalid={!!formErrors.type}
                  aria-describedby={formErrors.type ? "vehicleType-error" : undefined}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.type && <p id="vehicleType-error" className="mt-1 text-xs text-red-600">{formErrors.type}</p>}
            </div>
          </div>

          {/* Owner */}
          <div>
            <Label htmlFor="vehicleOwner">Owner</Label>
            <Select value={owner} onValueChange={(value) => setOwner(value)}>
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

          {/* Optional Fields Section */}
          <CardTitle className="text-md pt-4 border-t mt-4">Optional Details</CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialOdometer">Initial Odometer Reading (km)</Label>
              <Input
                id="initialOdometer"
                type="number"
                value={initialOdometer}
                onChange={(e) => setInitialOdometer(e.target.value)}
                placeholder="e.g., 15000"
              />
            </div>
            <div>
              <Label htmlFor="currentOdometer">Current Odometer Reading (km)</Label>
              <Input
                id="currentOdometer"
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                placeholder="e.g., 25000"
              />
            </div>
          </div>

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
              <Label htmlFor="insurancePremium">Insurance Premium Amount (₹)</Label>
              <Input
                id="insurancePremium"
                type="number"
                value={insurancePremium}
                onChange={(e) => setInsurancePremium(e.target.value)}
                placeholder="e.g., 2500"
              />
            </div>
            <div>
              <Label htmlFor="insuranceRenewalDate">Insurance Renewal Date</Label>
              <Input
                id="insuranceRenewalDate"
                type="date"
                value={insuranceRenewalDate}
                onChange={(e) => setInsuranceRenewalDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button type="submit" className="flex-1">
              {existingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel();
                // Consider resetting form states here if not unmounted
              }}
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
