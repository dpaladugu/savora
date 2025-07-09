import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Car, Search, Trash2, Edit, AlertTriangle as AlertIcon, Loader2, CalendarDays, ChevronDown, Shield, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea"; // For notes
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { db, DexieVehicleRecord } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define types for form select options
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Other'] as const;
type FuelType = typeof FUEL_TYPES[number];

// Form data can be a partial of DexieVehicleRecord, with some fields as string for input
export type VehicleFormData = Partial<Omit<DexieVehicleRecord, 'year' | 'mileage' | 'purchasePrice' | 'created_at' | 'updated_at'>> & {
  year?: string;
  mileage?: string;
  purchasePrice?: string;
};


export function VehicleManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<DexieVehicleRecord | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<DexieVehicleRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const { toast } = useToast();

  const liveVehicles = useLiveQuery(
    async () => {
      let query = db.vehicles.orderBy('name');
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        query = query.filter(v =>
          v.name.toLowerCase().includes(lowerSearchTerm) ||
          v.registrationNumber.toLowerCase().includes(lowerSearchTerm) ||
          (v.make && v.make.toLowerCase().includes(lowerSearchTerm)) ||
          (v.model && v.model.toLowerCase().includes(lowerSearchTerm))
        );
      }
      return await query.toArray();
    },
    [searchTerm],
    []
  );
  const vehicles = liveVehicles || [];

  const handleAddNew = () => {
    setEditingVehicle(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (vehicle: DexieVehicleRecord) => {
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (vehicle: DexieVehicleRecord) => {
    setVehicleToDelete(vehicle);
  };

  const handleDeleteVehicleExecute = async () => {
    if (!vehicleToDelete || !vehicleToDelete.id) return;
    try {
      await db.vehicles.delete(vehicleToDelete.id);
      toast({
        title: "Vehicle Deleted",
        description: `Vehicle "${vehicleToDelete.name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({ title: "Error", description: "Could not delete vehicle.", variant: "destructive" });
    } finally {
      setVehicleToDelete(null);
    }
  };

  const isInsuranceExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate || !isValidDate(parseISO(expiryDate))) return false;
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Manager</h1>
          <p className="text-muted-foreground">Track and manage your vehicles.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Summary */}
      <Card className="shadow">
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
                        <span className={`font-medium ${isInsuranceExpiringSoon(vehicle.insuranceExpiryDate) ? 'text-orange-600' : 'text-foreground'}`}>
                          {vehicle.insuranceExpiryDate && isValidDate(parseISO(vehicle.insuranceExpiryDate)) ? format(parseISO(vehicle.insuranceExpiryDate), 'PPP') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Related Data Section */}
                    <div className="mt-3">
                      <Collapsible 
                        open={expandedVehicle === vehicle.id}
                        onOpenChange={(open) => setExpandedVehicle(open ? vehicle.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 p-2">
                            <span className="text-xs text-muted-foreground">View Related Data</span>
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {/* Related Insurance */}
                          {mockInsurancePolicies[vehicle.id] && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Insurance Policies</span>
                              </div>
                              {mockInsurancePolicies[vehicle.id].map(policy => (
                                <div key={policy.id} className="text-xs text-blue-700 dark:text-blue-300">
                                  {policy.insurer} - ₹{policy.premium.toLocaleString()} 
                                  (Expires: {new Date(policy.expiryDate).toLocaleDateString('en-IN')})
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recent Expenses */}
                          {mockRelatedExpenses[vehicle.id] && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Receipt className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">Recent Expenses</span>
                              </div>
                              <div className="space-y-1">
                                {mockRelatedExpenses[vehicle.id].slice(0, 3).map(expense => (
                                  <div key={expense.id} className="text-xs text-green-700 dark:text-green-300 flex justify-between">
                                    <span>{expense.tag}</span>
                                    <span>₹{expense.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
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

// --- AddVehicleForm Sub-Component ---
interface AddVehicleFormProps {
  initialData?: DexieVehicleRecord | null;
  onClose: () => void;
}

function AddVehicleForm({ initialData, onClose }: AddVehicleFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VehicleFormData>(() => {
    const defaults: VehicleFormData = {
      name: '', registrationNumber: '', make: '', model: '', fuelType: 'Petrol',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'), user_id: 'default_user',
      year: '', mileage: '', purchasePrice: '', color: '', engineNumber: '', chassisNumber: '',
      insurancePolicyNumber: '', insuranceExpiryDate: '', notes: ''
    };
    if (initialData) {
      return {
        ...initialData,
        id: initialData.id,
        year: initialData.year?.toString() || '',
        mileage: initialData.mileage?.toString() || '',
        purchasePrice: initialData.purchasePrice?.toString() || '',
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : defaults.purchaseDate,
        insuranceExpiryDate: initialData.insuranceExpiryDate ? format(parseISO(initialData.insuranceExpiryDate), 'yyyy-MM-dd') : defaults.insuranceExpiryDate,
        fuelType: initialData.fuelType as FuelType || defaults.fuelType,
      };
    }
    return defaults;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});


  useEffect(() => {
    const defaults: VehicleFormData = {
      name: '', registrationNumber: '', make: '', model: '', fuelType: 'Petrol',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'), user_id: 'default_user',
      year: '', mileage: '', purchasePrice: '', color: '', engineNumber: '', chassisNumber: '',
      insurancePolicyNumber: '', insuranceExpiryDate: '', notes: ''
    };
    if (initialData) {
      setFormData({
        ...initialData,
        id: initialData.id,
        year: initialData.year?.toString() || '',
        mileage: initialData.mileage?.toString() || '',
        purchasePrice: initialData.purchasePrice?.toString() || '',
        purchaseDate: initialData.purchaseDate ? format(parseISO(initialData.purchaseDate), 'yyyy-MM-dd') : defaults.purchaseDate,
        insuranceExpiryDate: initialData.insuranceExpiryDate ? format(parseISO(initialData.insuranceExpiryDate), 'yyyy-MM-dd') : defaults.insuranceExpiryDate,
        fuelType: initialData.fuelType as FuelType || defaults.fuelType,
      });
    } else {
      setFormData(defaults);
    }
    setFormErrors({}); // Clear errors on open/initialData change
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof VehicleFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };
  const handleSelectChange = (name: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof VehicleFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };
  const handleDateChange = (name: keyof VehicleFormData, date?: Date) => {
    setFormData(prev => ({ ...prev, [name]: date ? format(date, 'yyyy-MM-dd') : undefined }));
     if (formErrors[name as keyof VehicleFormData]) setFormErrors(prev => ({...prev, [name]: undefined}));
  };

  const validateCurrentForm = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};
    if (!formData.name?.trim()) newErrors.name = "Vehicle Name is required.";
    if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = "Registration No. is required.";
    if (!formData.make?.trim()) newErrors.make = "Make is required.";
    if (!formData.model?.trim()) newErrors.model = "Model is required.";
    if (formData.year && (isNaN(parseInt(formData.year)) || formData.year.length !== 4)) newErrors.year = "Enter a valid 4-digit year.";
    if (formData.mileage && isNaN(parseFloat(formData.mileage))) newErrors.mileage = "Mileage must be a number.";
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) newErrors.purchasePrice = "Purchase Price must be a number.";
    if (formData.purchaseDate && !isValidDate(parseISO(formData.purchaseDate))) newErrors.purchaseDate = "Invalid Purchase Date.";
    if (formData.insuranceExpiryDate && !isValidDate(parseISO(formData.insuranceExpiryDate))) newErrors.insuranceExpiryDate = "Invalid Insurance Expiry Date.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!validateCurrentForm()){
        toast({ title: "Validation Error", description: "Please correct the form errors.", variant: "destructive"});
        return;
    }
    setIsSaving(true);

    const yearNum = formData.year ? parseInt(formData.year) : undefined;
    const mileageNum = formData.mileage ? parseFloat(formData.mileage) : undefined;
    const purchasePriceNum = formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined;

    const record: Omit<DexieVehicleRecord, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name!,
      registrationNumber: formData.registrationNumber!.toUpperCase(),
      make: formData.make || '',
      model: formData.model || '',
      year: yearNum,
      fuelType: formData.fuelType || 'Other',
      color: formData.color || '',
      mileage: mileageNum,
      purchaseDate: formData.purchaseDate,
      purchasePrice: purchasePriceNum,
      insurancePolicyNumber: formData.insurancePolicyNumber || '',
      insuranceExpiryDate: formData.insuranceExpiryDate,
      engineNumber: formData.engineNumber || '',
      chassisNumber: formData.chassisNumber || '',
      notes: formData.notes || '',
      user_id: formData.user_id || 'default_user',
    };

    try {
      if (formData.id) {
        await db.vehicles.update(formData.id, { ...record, updated_at: new Date() });
        toast({ title: "Success", description: "Vehicle details updated." });
      } else {
        const newId = self.crypto.randomUUID();
        await db.vehicles.add({ ...record, id: newId, created_at: new Date(), updated_at: new Date() });
        toast({ title: "Success", description: "Vehicle added." });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save vehicle:", error);
      toast({ title: "Database Error", description: "Could not save vehicle details.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // The form is now a Dialog itself, triggered by parent's showAddForm state
    <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">{formData.id ? 'Edit' : 'Add New'} Vehicle</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required className={formErrors.name ? 'border-red-500' : ''}/>
            {formErrors.name && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.name}</p>}
          </div>
          <div>
            <Label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration No. *</Label>
            <Input id="registrationNumber" name="registrationNumber" value={formData.registrationNumber || ''} onChange={handleChange} required className={formErrors.registrationNumber ? 'border-red-500' : ''}/>
            {formErrors.registrationNumber && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.registrationNumber}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make *</Label>
            <Input id="make" name="make" value={formData.make || ''} onChange={handleChange} required className={formErrors.make ? 'border-red-500' : ''}/>
            {formErrors.make && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.make}</p>}
          </div>
          <div>
            <Label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model *</Label>
            <Input id="model" name="model" value={formData.model || ''} onChange={handleChange} required className={formErrors.model ? 'border-red-500' : ''}/>
            {formErrors.model && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.model}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year (Mfg.)</Label>
            <Input id="year" name="year" type="number" value={formData.year || ''} onChange={handleChange} className={formErrors.year ? 'border-red-500' : ''}/>
            {formErrors.year && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.year}</p>}
          </div>
          <div>
            <Label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Type</Label>
            <Select name="fuelType" value={formData.fuelType || 'Petrol'} onValueChange={v => handleSelectChange('fuelType', v as string)}>
              <SelectTrigger className={formErrors.fuelType ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
              <SelectContent>{FUEL_TYPES.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}</SelectContent>
            </Select>
            {formErrors.fuelType && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.fuelType}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</Label>
            <Input id="color" name="color" value={formData.color || ''} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mileage (km/unit)</Label>
            <Input id="mileage" name="mileage" type="number" step="0.1" value={formData.mileage || ''} onChange={handleChange} className={formErrors.mileage ? 'border-red-500' : ''}/>
            {formErrors.mileage && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.mileage}</p>}
          </div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.purchaseDate ? 'border-red-500' : ''}`}><CalendarDays className="mr-2 h-4 w-4" />{formData.purchaseDate && isValidDate(parseISO(formData.purchaseDate)) ? format(parseISO(formData.purchaseDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.purchaseDate ? parseISO(formData.purchaseDate) : undefined} onSelect={d => handleDateChange('purchaseDate', d)} /></PopoverContent></Popover>
                {formErrors.purchaseDate && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.purchaseDate}</p>}
            </div>
            <div>
                <Label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price (₹)</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" value={formData.purchasePrice || ''} onChange={handleChange} className={formErrors.purchasePrice ? 'border-red-500' : ''}/>
                {formErrors.purchasePrice && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.purchasePrice}</p>}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Policy No.</Label>
                <Input id="insurancePolicyNumber" name="insurancePolicyNumber" value={formData.insurancePolicyNumber || ''} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="insuranceExpiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Expiry</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={`w-full justify-start text-left font-normal ${formErrors.insuranceExpiryDate ? 'border-red-500' : ''}`}><CalendarDays className="mr-2 h-4 w-4" />{formData.insuranceExpiryDate && isValidDate(parseISO(formData.insuranceExpiryDate)) ? format(parseISO(formData.insuranceExpiryDate), 'PPP') : "Pick date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.insuranceExpiryDate ? parseISO(formData.insuranceExpiryDate) : undefined} onSelect={d => handleDateChange('insuranceExpiryDate', d)} /></PopoverContent></Popover>
                {formErrors.insuranceExpiryDate && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertIcon className="w-3 h-3 mr-1"/>{formErrors.insuranceExpiryDate}</p>}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="engineNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Engine No.</Label><Input id="engineNumber" name="engineNumber" value={formData.engineNumber || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="chassisNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chassis No.</Label><Input id="chassisNumber" name="chassisNumber" value={formData.chassisNumber || ''} onChange={handleChange} /></div>
        </div>
        <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Any additional notes..."/>
        </div>

        <DialogFooter className="pt-5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (formData.id ? 'Update Vehicle' : 'Save Vehicle')}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
    </Dialog>
  );
}
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
