import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import type { Tenant, RentalProperty } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface TenantModalProps {
  tenant?: Tenant;
  onSave: () => void;
  trigger: React.ReactNode;
}

export function TenantModal({ tenant, onSave, trigger }: TenantModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  
  const [formData, setFormData] = useState({
    propertyId: tenant?.propertyId || "",
    tenantName: tenant?.tenantName || "",
    roomNo: tenant?.roomNo || "",
    monthlyRent: tenant?.monthlyRent || 0,
    depositPaid: tenant?.depositPaid || 0,
    joinDate: tenant?.joinDate ? tenant.joinDate.toISOString().split('T')[0] : "",
    endDate: tenant?.endDate ? tenant.endDate.toISOString().split('T')[0] : "",
    tenantContact: tenant?.tenantContact || "",
  });

  const handleSave = async () => {
    try {
      const tenantData = {
        id: tenant?.id || crypto.randomUUID(),
        propertyId: formData.propertyId,
        rentalPropertyId: formData.propertyId, // Same as propertyId
        tenantName: formData.tenantName,
        name: formData.tenantName, // Same as tenantName
        roomNo: formData.roomNo || undefined,
        monthlyRent: formData.monthlyRent,
        rentAmount: formData.monthlyRent, // Same as monthlyRent
        depositPaid: formData.depositPaid,
        securityDeposit: formData.depositPaid, // Same as depositPaid
        joinDate: new Date(formData.joinDate),
        moveInDate: new Date(formData.joinDate), // Same as joinDate
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        phone: formData.tenantContact,
        rentDueDate: 1, // Default to 1st of month
        depositRefundPending: false,
        tenantContact: formData.tenantContact,
      };

      if (tenant) {
        await db.tenants.update(tenant.id, tenantData);
      } else {
        await db.tenants.add(tenantData);
      }

      onSave();
      setOpen(false);
      toast({
        title: `Tenant ${tenant ? 'updated' : 'added'} successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: "Error saving tenant",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchProperties = async () => {
      const properties = await db.rentalProperties.findMany();
      setProperties(properties);
    };

    fetchProperties();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Edit' : 'Add'} Tenant</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="property" className="text-right">Property</Label>
            <Select value={formData.propertyId} onValueChange={(value) => setFormData({...formData, propertyId: value})}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenantName" className="text-right">Name</Label>
            <Input
              id="tenantName"
              value={formData.tenantName}
              onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomNo" className="text-right">Room No</Label>
            <Input
              id="roomNo"
              value={formData.roomNo}
              onChange={(e) => setFormData({...formData, roomNo: e.target.value})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlyRent" className="text-right">Monthly Rent</Label>
            <Input
              id="monthlyRent"
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({...formData, monthlyRent: Number(e.target.value)})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depositPaid" className="text-right">Deposit</Label>
            <Input
              id="depositPaid"
              type="number"
              value={formData.depositPaid}
              onChange={(e) => setFormData({...formData, depositPaid: Number(e.target.value)})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="joinDate" className="text-right">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tenantContact" className="text-right">Contact</Label>
            <Input
              id="tenantContact"
              value={formData.tenantContact}
              onChange={(e) => setFormData({...formData, tenantContact: e.target.value})}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
