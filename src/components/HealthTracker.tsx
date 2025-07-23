
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealthProfiles } from '@/hooks/useLiveData';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { AddMedicineModal } from './AddMedicineModal';

export function HealthTracker() {
  const profiles = useHealthProfiles();
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleAddMedicine = (profileId: string) => {
    setSelectedProfileId(profileId);
    setShowMedicineModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Health Tracker</h1>
      </div>

      <div className="grid gap-4">
        {profiles?.map((profile) => (
          <Card key={profile.id} className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{profile.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMedicine(profile.id)}
                  >
                    <Pill className="w-4 h-4 mr-1" />
                    Add Medicine
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{profile.dob.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{profile.bloodGroup || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <p className="font-medium">{profile.allergies?.join(', ') || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                  <p className="font-medium">{profile.chronicConditions?.join(', ') || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddMedicineModal
        isOpen={showMedicineModal}
        onClose={() => setShowMedicineModal(false)}
        profileId={selectedProfileId}
      />
    </div>
  );
}
