
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealth } from '@/hooks/useLiveData';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { AddMedicineModal } from './AddMedicineModal';

export function HealthTracker() {
  const healthProfiles = useHealth();
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
        {healthProfiles?.map((profile) => (
          <Card key={profile.id} className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Health Profile {profile.id}</span>
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
                  <p className="text-sm text-muted-foreground">Refill Alert Days</p>
                  <p className="font-medium">{profile.refillAlertDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allergy Severity</p>
                  <p className="font-medium">{profile.allergySeverity || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{profile.emergencyContact || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Checkup</p>
                  <p className="font-medium">{profile.nextCheckupDate?.toLocaleDateString() || 'Not scheduled'}</p>
                </div>
              </div>
              {profile.prescriptions && profile.prescriptions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Recent Prescriptions</p>
                  <div className="space-y-2">
                    {profile.prescriptions.slice(0, 3).map((prescription, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded">
                        <p className="text-sm font-medium">{prescription.medicines.join(', ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {prescription.doctor} - {prescription.date.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
