import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VehicleData } from '@/types/jsonPreload';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface AddVehicleFormProps {
  onSubmit: (vehicle: Omit<VehicleData, 'id'>) => void;
  onCancel: () => void;
  existingVehicle?: VehicleData | null;
}

// Zod schema for validation - ensuring vehicle_name is required
const vehicleSchema = z.object({
  vehicle_name: z.string().min(1, "Vehicle Name is required."),
  registrationNumber: z.string().min(1, "Registration Number is required."),
  type: z.string().min(1, "Type is required."),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  engineNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  currentOdometer: z.number().optional(),
  fuelEfficiency: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insurance_premium: z.number().optional(),
  insurance_frequency: z.string().optional(),
  insurance_next_renewal: z.string().optional(),
  tracking_type: z.string().optional(),
  tracking_last_service_odometer: z.number().optional(),
  next_pollution_check: z.string().optional(),
  location: z.string().optional(),
  repair_estimate: z.number().optional(),
  notes: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const vehicleTypeOptions = ['Car', 'Motorcycle', 'Scooter', 'Other'];
const fuelTypeOptions = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Other'];
const ownerOptions = ['Self', 'Family', 'Company'];
const statusOptions = ['Active', 'Sold', 'In Repair', 'Out of Service'];
const insuranceFrequencyOptions = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', '3-Year', '5-Year'];

export function AddVehicleForm({ onSubmit, onCancel, existingVehicle = null }: AddVehicleFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_name: '',
      registrationNumber: '',
      type: 'Car',
      make: '',
      model: '',
      year: undefined,
      color: '',
      fuelType: '',
      owner: '',
      status: 'Active',
      purchaseDate: '',
      purchasePrice: undefined,
      engineNumber: '',
      chassisNumber: '',
      currentOdometer: undefined,
      fuelEfficiency: '',
      insurance_provider: '',
      insurancePolicyNumber: '',
      insurance_premium: undefined,
      insurance_frequency: '',
      insurance_next_renewal: '',
      tracking_type: '',
      tracking_last_service_odometer: undefined,
      next_pollution_check: '',
      location: '',
      repair_estimate: undefined,
      notes: '',
    }
  });

  useEffect(() => {
    if (existingVehicle) {
      reset({
        ...existingVehicle,
        year: existingVehicle.year || undefined,
        purchasePrice: existingVehicle.purchasePrice || undefined,
        currentOdometer: existingVehicle.currentOdometer || undefined,
        insurance_premium: existingVehicle.insurance_premium || undefined,
        tracking_last_service_odometer: existingVehicle.tracking_last_service_odometer || undefined,
        repair_estimate: existingVehicle.repair_estimate || undefined,
      });
    } else {
      reset();
    }
  }, [existingVehicle, reset]);

  const processSubmit = (data: VehicleFormData) => {
    // Ensure vehicle_name is always provided
    const submissionData: Omit<VehicleData, 'id'> = {
      ...data,
      vehicle_name: data.vehicle_name || '', // This should never be empty due to validation
    };
    onSubmit(submissionData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{existingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
        <CardDescription>
          {existingVehicle ? 'Update the details of your vehicle.' : 'Enter the details for your new vehicle. Fields marked * are required.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">

          <CardTitle className="text-lg pt-2 border-b pb-2 mb-3">Core Details</CardTitle>

          <div>
            <Label htmlFor="vehicle_name">Vehicle Nickname*</Label>
            <Input id="vehicle_name" {...register('vehicle_name')} placeholder="e.g., My Honda City, Dad's Scooter" />
            {errors.vehicle_name && <p className="mt-1 text-xs text-destructive">{errors.vehicle_name.message}</p>}
          </div>

          <div>
            <Label htmlFor="registrationNumber">Registration Number*</Label>
            <Input id="registrationNumber" {...register('registrationNumber')} placeholder="e.g., MH12AB1234" />
            {errors.registrationNumber && <p className="mt-1 text-xs text-destructive">{errors.registrationNumber.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input id="make" {...register('make')} placeholder="e.g., Honda, Maruti, Bajaj" />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register('model')} placeholder="e.g., City, Swift, Pulsar" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Manufacturing Year</Label>
              <Input id="year" type="number" {...register('year', { valueAsNumber: true })} placeholder="e.g., 2020" />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register('color')} placeholder="e.g., Red, Blue" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Controller
                name="fuelType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select fuel type..." /></SelectTrigger>
                    <SelectContent>{fuelTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="type">Category*</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>{vehicleTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner">Owner</Label>
               <Controller
                name="owner"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select owner..." /></SelectTrigger>
                    <SelectContent>{ownerOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
               <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                    <SelectContent>{statusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <CardTitle className="text-lg pt-4 border-b pb-2 mb-3 mt-6">Purchase & Technical Details</CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
              <Input id="purchasePrice" type="number" {...register('purchasePrice', { valueAsNumber: true })} placeholder="e.g., 800000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engineNumber">Engine Number</Label>
              <Input id="engineNumber" {...register('engineNumber')} placeholder="Engine No." />
            </div>
            <div>
              <Label htmlFor="chassisNumber">Chassis Number</Label>
              <Input id="chassisNumber" {...register('chassisNumber')} placeholder="Chassis No." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentOdometer">Current Odometer (km)</Label>
              <Input id="currentOdometer" type="number" {...register('currentOdometer', { valueAsNumber: true })} placeholder="e.g., 25000" />
            </div>
            <div>
              <Label htmlFor="fuelEfficiency">Fuel Efficiency</Label>
              <Input id="fuelEfficiency" {...register('fuelEfficiency')} placeholder="e.g., 15 kmpl or 100 km/charge" />
            </div>
          </div>

          <CardTitle className="text-lg pt-4 border-b pb-2 mb-3 mt-6">Insurance Details</CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurance_provider">Insurance Provider</Label>
              <Input id="insurance_provider" {...register('insurance_provider')} placeholder="e.g., Tata AIG" />
            </div>
            <div>
              <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
              <Input id="insurancePolicyNumber" {...register('insurancePolicyNumber')} placeholder="Policy No." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="insurance_premium">Premium Amount (₹)</Label>
              <Input id="insurance_premium" type="number" {...register('insurance_premium', { valueAsNumber: true })} placeholder="e.g., 2500" />
            </div>
            <div>
              <Label htmlFor="insurance_frequency">Premium Frequency</Label>
              <Controller
                name="insurance_frequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select frequency..." /></SelectTrigger>
                    <SelectContent>{insuranceFrequencyOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="insurance_next_renewal">Next Renewal Date</Label>
              <Input id="insurance_next_renewal" type="date" {...register('insurance_next_renewal')} />
            </div>
          </div>

          <CardTitle className="text-lg pt-4 border-b pb-2 mb-3 mt-6">Tracking & Maintenance</CardTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tracking_type">Tracking Device/Type</Label>
              <Input id="tracking_type" {...register('tracking_type')} placeholder="e.g., GPS, FASTag ID" />
            </div>
            <div>
              <Label htmlFor="location">Current Location/Parking</Label>
              <Input id="location" {...register('location')} placeholder="e.g., Home Garage" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tracking_last_service_odometer">Last Service Odometer (km)</Label>
              <Input id="tracking_last_service_odometer" type="number" {...register('tracking_last_service_odometer', { valueAsNumber: true })} placeholder="e.g., 22500" />
            </div>
            <div>
              <Label htmlFor="next_pollution_check">Pollution Check Due</Label>
              <Input id="next_pollution_check" type="date" {...register('next_pollution_check')} />
            </div>
          </div>

          <div>
            <Label htmlFor="repair_estimate">Current Repair Estimate (₹)</Label>
            <Input id="repair_estimate" type="number" {...register('repair_estimate', { valueAsNumber: true })} placeholder="Amount if any repair is ongoing/quoted" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Any other relevant notes about the vehicle..." {...register('notes')} />
          </div>

          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button type="submit" className="flex-1">
              {existingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
