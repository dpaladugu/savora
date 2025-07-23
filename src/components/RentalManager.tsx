
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRentals } from '@/hooks/useLiveData';
import { formatCurrency } from '@/lib/format-utils';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { TenantModal } from './TenantModal';
import { EditRentalModal } from './EditRentalModal';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

export function RentalManager() {
  const rentals = useRentals();
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);

  const handleAddTenant = (rentalId: string) => {
    setSelectedRentalId(rentalId);
    setShowTenantModal(true);
  };

  const handleEditRental = (rentalId: string) => {
    setSelectedRentalId(rentalId);
    setShowEditModal(true);
  };

  const handleDeleteRental = async (rentalId: string) => {
    if (confirm('Are you sure you want to delete this rental property?')) {
      try {
        await db.rentalProperties.delete(rentalId);
        toast.success('Rental property deleted successfully');
      } catch (error) {
        toast.error('Failed to delete rental property');
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rental Properties</h1>
      </div>

      <div className="grid gap-4">
        {rentals?.map((rental) => (
          <Card key={rental.id} className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{rental.address}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTenant(rental.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tenant
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRental(rental.id)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteRental(rental.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{rental.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{rental.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Square Yards</p>
                  <p className="font-medium">{rental.squareYards}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium">{formatCurrency(rental.monthlyRent)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Tenants</p>
                  <p className="font-medium">{rental.maxTenants}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Day</p>
                  <p className="font-medium">{rental.dueDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Escalation</p>
                  <p className="font-medium">{rental.escalationPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TenantModal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        rentalId={selectedRentalId}
      />

      <EditRentalModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        rentalId={selectedRentalId}
      />
    </div>
  );
}
