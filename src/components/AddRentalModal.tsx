import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { db } from '@/lib/db';
import { RentalProperty } from '@/lib/db';

export function AddRentalModal() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    address: '',
    owner: 'Me',
    type: 'Apartment',
    squareYards: '',
    monthlyRent: '',
    dueDay: '',
    escalationPercent: '',
    escalationDate: '',
    lateFeeRate: '',
    noticePeriodDays: '',
    propertyTaxAnnual: '',
    propertyTaxDueDay: '',
    waterTaxAnnual: '',
    waterTaxDueDay: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rentalData: Omit<RentalProperty, 'id'> = {
      id: crypto.randomUUID(),
      address: formData.address,
      owner: formData.owner as 'Me' | 'Mother' | 'Grandmother',
      type: formData.type as 'Apartment' | 'House' | 'Commercial' | 'Plot',
      squareYards: parseFloat(formData.squareYards),
      monthlyRent: parseFloat(formData.monthlyRent),
      dueDay: parseInt(formData.dueDay),
      escalationPercent: parseFloat(formData.escalationPercent) || 0,
      escalationDate: formData.escalationDate ? new Date(formData.escalationDate) : undefined,
      lateFeeRate: parseFloat(formData.lateFeeRate) || 0,
      noticePeriodDays: parseInt(formData.noticePeriodDays) || 30,
      depositRefundPending: false,
      propertyTaxAnnual: parseFloat(formData.propertyTaxAnnual) || 0,
      propertyTaxDueDay: parseInt(formData.propertyTaxDueDay) || 1,
      waterTaxAnnual: parseFloat(formData.waterTaxAnnual) || 0,
      waterTaxDueDay: parseInt(formData.waterTaxDueDay) || 1,
      maintenanceReserve: parseFloat(formData.monthlyRent) * 0.1 // Default to 10% of monthly rent
    };

    try {
      await db.rentalProperties.add(rentalData);
      toast({
        title: "Success",
        description: "Rental property added successfully.",
      })
      setOpen(false);
    } catch (error) {
      console.error("Error adding rental property:", error);
      toast({
        title: "Error",
        description: "Failed to add rental property. Please try again.",
        variant: "destructive",
      })
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Add Rental Property</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add New Rental Property</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the details of the rental property to keep track of your investments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">Owner</Label>
            <Select onValueChange={(value) => setFormData(prevData => ({ ...prevData, owner: value }))} defaultValue={formData.owner}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Me">Me</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Grandmother">Grandmother</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select onValueChange={(value) => setFormData(prevData => ({ ...prevData, type: value }))} defaultValue={formData.type}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Plot">Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="squareYards" className="text-right">Square Yards</Label>
            <Input type="number" id="squareYards" name="squareYards" value={formData.squareYards} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlyRent" className="text-right">Monthly Rent</Label>
            <Input type="number" id="monthlyRent" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDay" className="text-right">Due Day</Label>
            <Input type="number" id="dueDay" name="dueDay" value={formData.dueDay} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="escalationPercent" className="text-right">Escalation %</Label>
            <Input type="number" id="escalationPercent" name="escalationPercent" value={formData.escalationPercent} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="escalationDate" className="text-right">Escalation Date</Label>
            <Input type="date" id="escalationDate" name="escalationDate" value={formData.escalationDate} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lateFeeRate" className="text-right">Late Fee Rate</Label>
            <Input type="number" id="lateFeeRate" name="lateFeeRate" value={formData.lateFeeRate} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="noticePeriodDays" className="text-right">Notice Period (Days)</Label>
            <Input type="number" id="noticePeriodDays" name="noticePeriodDays" value={formData.noticePeriodDays} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="propertyTaxAnnual" className="text-right">Property Tax (Annual)</Label>
            <Input type="number" id="propertyTaxAnnual" name="propertyTaxAnnual" value={formData.propertyTaxAnnual} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="propertyTaxDueDay" className="text-right">Property Tax Due Day</Label>
            <Input type="number" id="propertyTaxDueDay" name="propertyTaxDueDay" value={formData.propertyTaxDueDay} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="waterTaxAnnual" className="text-right">Water Tax (Annual)</Label>
            <Input type="number" id="waterTaxAnnual" name="waterTaxAnnual" value={formData.waterTaxAnnual} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="waterTaxDueDay" className="text-right">Water Tax Due Day</Label>
            <Input type="number" id="waterTaxDueDay" name="waterTaxDueDay" value={formData.waterTaxDueDay} onChange={handleChange} className="col-span-3" />
          </div>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction type="submit" onClick={handleSubmit}>Add Property</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
