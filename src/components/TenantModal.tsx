import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { db, RentalProperty, Tenant } from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId: string;
}

export function TenantModal({ isOpen, onClose, rentalId }: TenantModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    propertyId: rentalId,
    rentalPropertyId: rentalId,
    tenantName: '',
    name: '',
    phone: '',
    email: '',
    roomNo: '',
    monthlyRent: '',
    rentAmount: '',
    securityDeposit: '',
    depositPaid: '',
    depositRefundPending: false,
    tenantContact: '',
    joinDate: new Date().toISOString().split('T')[0],
    moveInDate: new Date().toISOString().split('T')[0],
    endDate: '',
    rentDueDate: '1',
  });
  const [rentalProperties, setRentalProperties] = useState<RentalProperty[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTenant: Omit<Tenant, 'id'> = {
      propertyId: formData.propertyId,
      rentalPropertyId: formData.rentalPropertyId,
      tenantName: formData.tenantName,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      roomNo: formData.roomNo,
      monthlyRent: parseFloat(formData.monthlyRent),
      rentAmount: parseFloat(formData.rentAmount),
      securityDeposit: parseFloat(formData.securityDeposit),
      depositPaid: parseFloat(formData.depositPaid),
      depositRefundPending: false,
      tenantContact: formData.tenantContact,
      joinDate: new Date(formData.joinDate),
      moveInDate: new Date(formData.moveInDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      rentDueDate: parseInt(formData.rentDueDate),
    };

    try {
      await db.tenants.add({
        id: crypto.randomUUID(),
        ...newTenant
      });
      toast({
        title: "Success",
        description: "Tenant added successfully.",
      })
      onClose();
    } catch (error) {
      console.error("Error adding tenant:", error);
      toast({
        title: "Error",
        description: "Failed to add tenant.",
        variant: "destructive"
      })
    }
  };

  useEffect(() => {
    const loadRentalProperties = async () => {
      try {
        const properties = await db.rentalProperties.toArray();
        setRentalProperties(properties);
      } catch (error) {
        console.error('Error loading rental properties:', error);
      }
    };

    if (isOpen) {
      loadRentalProperties();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Add a new tenant to your rental property.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="propertyId" className="text-right">
              Property
            </Label>
            <Select
              name="propertyId"
              onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value, rentalPropertyId: value }))}
              defaultValue={formData.propertyId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {rentalProperties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenantName" className="text-right">
              Tenant Name
            </Label>
            <Input id="tenantName" name="tenantName" value={formData.tenantName} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Contact Name
            </Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomNo" className="text-right">
              Room/Unit No.
            </Label>
            <Input id="roomNo" name="roomNo" value={formData.roomNo} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlyRent" className="text-right">
              Monthly Rent
            </Label>
            <Input id="monthlyRent" name="monthlyRent" type="number" value={formData.monthlyRent} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rentAmount" className="text-right">
              Rent Amount
            </Label>
            <Input id="rentAmount" name="rentAmount" type="number" value={formData.rentAmount} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="securityDeposit" className="text-right">
              Security Deposit
            </Label>
            <Input id="securityDeposit" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depositPaid" className="text-right">
              Deposit Paid
            </Label>
            <Input id="depositPaid" name="depositPaid" type="number" value={formData.depositPaid} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="joinDate" className="text-right">
              Join Date
            </Label>
            <Input type="date" id="joinDate" name="joinDate" value={formData.joinDate} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="moveInDate" className="text-right">
              Move-in Date
            </Label>
            <Input type="date" id="moveInDate" name="moveInDate" value={formData.moveInDate} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rentDueDate" className="text-right">
              Rent Due Date
            </Label>
            <Input
              type="number"
              id="rentDueDate"
              name="rentDueDate"
              value={formData.rentDueDate}
              onChange={handleChange}
              className="col-span-3"
              min="1"
              max="31"
            />
          </div>
        </div>
        <Button type="submit" onClick={handleSubmit}>Add Tenant</Button>
      </DialogContent>
    </Dialog>
  );
}
