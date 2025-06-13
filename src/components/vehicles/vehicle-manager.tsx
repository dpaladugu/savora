
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Car, Search, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface Vehicle {
  id: string;
  name: string;
  number: string;
  engineNumber: string;
  chassisNumber: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
  color: string;
  mileage: number;
  purchaseDate: string;
  insuranceExpiry: string;
  make: string;
  model: string;
}

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'My Swift',
    number: 'TS09AB1234',
    engineNumber: 'ABC123456',
    chassisNumber: 'DEF789012',
    fuelType: 'Petrol',
    color: 'White',
    mileage: 22,
    purchaseDate: '2022-03-15',
    insuranceExpiry: '2024-03-14',
    make: 'Maruti Suzuki',
    model: 'Swift VXI'
  }
];

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddVehicle = (newVehicle: Omit<Vehicle, 'id'>) => {
    const vehicle: Vehicle = {
      ...newVehicle,
      id: Date.now().toString()
    };
    
    setVehicles([vehicle, ...vehicles]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save vehicle to Firestore:', vehicle);
    
    toast({
      title: "Vehicle added successfully",
      description: `${newVehicle.name} has been added`,
    });
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete vehicle from Firestore:', id);
    toast({
      title: "Vehicle removed",
    });
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isInsuranceExpiring = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const getFuelTypeColor = (fuelType: string) => {
    const colors: Record<string, string> = {
      'Petrol': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Diesel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Electric': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'CNG': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[fuelType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vehicles</h2>
          <p className="text-muted-foreground">Manage your vehicles</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Summary */}
      <Card className="metric-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-blue text-white">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vehicles</p>
              <p className="text-lg font-bold text-foreground">{vehicles.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <AddVehicleForm 
          onSubmit={handleAddVehicle}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-3">
        {filteredVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground text-lg">
                        {vehicle.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFuelTypeColor(vehicle.fuelType)}`}>
                        {vehicle.fuelType}
                      </span>
                      {isInsuranceExpiring(vehicle.insuranceExpiry) && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          <AlertTriangle className="w-3 h-3" />
                          Insurance Expiring
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-medium text-foreground">{vehicle.number}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{vehicle.make} {vehicle.model}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium text-foreground">{vehicle.mileage} km/l</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Color: {vehicle.color}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Insurance Expires:</span>
                        <span className={`font-medium ${isInsuranceExpiring(vehicle.insuranceExpiry) ? 'text-orange-600' : 'text-foreground'}`}>
                          {new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {vehicles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Vehicles</h3>
          <p className="text-muted-foreground mb-4">Add your first vehicle</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Vehicle
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AddVehicleForm({ onSubmit, onCancel }: {
  onSubmit: (vehicle: Omit<Vehicle, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    engineNumber: '',
    chassisNumber: '',
    fuelType: 'Petrol' as Vehicle['fuelType'],
    color: '',
    mileage: '',
    purchaseDate: '',
    insuranceExpiry: '',
    make: '',
    model: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.number || !formData.make || !formData.model) {
      return;
    }

    onSubmit({
      name: formData.name,
      number: formData.number.toUpperCase(),
      engineNumber: formData.engineNumber,
      chassisNumber: formData.chassisNumber,
      fuelType: formData.fuelType,
      color: formData.color,
      mileage: parseFloat(formData.mileage) || 0,
      purchaseDate: formData.purchaseDate,
      insuranceExpiry: formData.insuranceExpiry,
      make: formData.make,
      model: formData.model
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Vehicle Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Swift"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Registration Number *
                </label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="TS09AB1234"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Make *
                </label>
                <Input
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Maruti Suzuki"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Model *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Swift VXI"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Fuel Type
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as Vehicle['fuelType'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Color
                </label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="White"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mileage (km/l)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="22"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Insurance Expiry
                </label>
                <Input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Engine Number
                </label>
                <Input
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                  placeholder="ABC123456"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Chassis Number
                </label>
                <Input
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                  placeholder="DEF789012"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Vehicle
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
    </motion.div>
  );
}
