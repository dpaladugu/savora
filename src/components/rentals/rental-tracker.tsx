
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Home, Search, Trash2, Edit, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/layout/module-header"; // Import ModuleHeader
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select

export interface RentalProperty {
  id: string;
  propertyName: string;
  propertyType: 'room' | 'shop' | 'apartment' | 'house' | 'office' | 'other';
  tenantName: string;
  tenantContact?: string;
  rentAmount: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseEndDate?: string;
  rentDueDay: number; // 1-31
  address: string;
  status: 'occupied' | 'vacant' | 'notice-period';
  lastRentPaid?: string;
  note?: string;
}

const mockRentals: RentalProperty[] = [
  {
    id: '1',
    propertyName: 'Shop A-1',
    propertyType: 'shop',
    tenantName: 'Ramesh Kumar',
    tenantContact: '9876543210',
    rentAmount: 25000,
    securityDeposit: 100000,
    leaseStartDate: '2023-04-01',
    leaseEndDate: '2025-03-31',
    rentDueDay: 5,
    address: 'MG Road, Bangalore',
    status: 'occupied',
    lastRentPaid: '2024-01-05'
  },
  {
    id: '2',
    propertyName: 'Room 2B',
    propertyType: 'room',
    tenantName: 'Priya Sharma',
    tenantContact: '9123456789',
    rentAmount: 12000,
    securityDeposit: 24000,
    leaseStartDate: '2023-07-15',
    rentDueDay: 15,
    address: 'HSR Layout, Bangalore',
    status: 'occupied',
    lastRentPaid: '2024-01-15'
  }
];

export function RentalTracker() {
  const [properties, setProperties] = useState<RentalProperty[]>(mockRentals);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddProperty = (newProperty: Omit<RentalProperty, 'id'>) => {
    const property: RentalProperty = {
      ...newProperty,
      id: Date.now().toString()
    };
    
    setProperties([property, ...properties]);
    setShowAddForm(false);
    
    // Logic to save to a local or remote database would go here.
    
    toast({
      title: "Property added successfully",
      description: `${newProperty.propertyName} - ₹${newProperty.rentAmount}/month`,
    });
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(prop => prop.id !== id));
    // Logic to delete rental property from a local or remote database would go here.
    toast({
      title: "Property deleted",
    });
  };

  const filteredProperties = properties.filter(property =>
    property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMonthlyRent = properties
    .filter(prop => prop.status === 'occupied')
    .reduce((sum, prop) => sum + prop.rentAmount, 0);

  const totalSecurityDeposit = properties.reduce((sum, prop) => sum + prop.securityDeposit, 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'occupied': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'vacant': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'notice-period': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[status] || colors['vacant'];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'room': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'shop': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'apartment': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'house': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'office': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || colors['other'];
  };

  const getDaysUntilRentDue = (rentDueDay: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, rentDueDay);
    
    // If the due date has passed this month, calculate for next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, rentDueDay);
    }
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (showAddForm) {
    return (
      <>
        <ModuleHeader
          title="Add Rental Property"
          showBackButton
          onBack={() => setShowAddForm(false)}
        />
        <div className="px-4 py-4 space-y-6"> {/* Content padding for form */}
          <AddPropertyForm
            onSubmit={handleAddProperty}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section removed. Title/subtitle should be provided by ModuleHeader via router. */}
      {/* The "Add Property" button might be passed as an 'action' to ModuleHeader,
          or exist as a primary action button within this component's layout.
          For now, let's place it visibly if not in a header.
      */}
      <div className="flex justify-end"> {/* Simple placement for the button for now */}
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalMonthlyRent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposits</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalSecurityDeposit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Property Form */}
      {showAddForm && (
        <AddPropertyForm 
          onSubmit={handleAddProperty}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Property List */}
      <div className="space-y-3">
        {filteredProperties.map((property, index) => (
          <motion.div
            key={property.id}
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
                        {property.propertyName}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(property.propertyType)}`}>
                        {property.propertyType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Tenant:</span>
                        <span className="font-medium text-foreground">{property.tenantName}</span>
                        {property.tenantContact && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{property.tenantContact}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="font-medium text-foreground">{formatCurrency(property.rentAmount)}/month</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Due: {property.rentDueDay}{getOrdinalSuffix(property.rentDueDay)}</span>
                        {property.status === 'occupied' && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-primary">
                              {getDaysUntilRentDue(property.rentDueDay)} days until due
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Deposit:</span>
                        <span className="font-medium text-foreground">{formatCurrency(property.securityDeposit)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Since {new Date(property.leaseStartDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{property.address}</p>
                      {property.note && (
                        <p className="text-sm text-muted-foreground">{property.note}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Calendar className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteProperty(property.id)}
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
      {properties.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Properties Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your rental income</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Property
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function AddPropertyForm({ onSubmit, onCancel }: {
  onSubmit: (property: Omit<RentalProperty, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    propertyName: '',
    propertyType: 'room' as RentalProperty['propertyType'],
    tenantName: '',
    tenantContact: '',
    rentAmount: '',
    securityDeposit: '',
    leaseStartDate: new Date().toISOString().split('T')[0],
    leaseEndDate: '',
    rentDueDay: '1',
    address: '',
    status: 'occupied' as RentalProperty['status'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyName || !formData.tenantName || !formData.rentAmount || !formData.address) {
      return;
    }

    onSubmit({
      propertyName: formData.propertyName,
      propertyType: formData.propertyType,
      tenantName: formData.tenantName,
      tenantContact: formData.tenantContact || undefined,
      rentAmount: parseFloat(formData.rentAmount),
      securityDeposit: parseFloat(formData.securityDeposit || '0'),
      leaseStartDate: formData.leaseStartDate,
      leaseEndDate: formData.leaseEndDate || undefined,
      rentDueDay: parseInt(formData.rentDueDay),
      address: formData.address,
      status: formData.status,
      note: formData.note || undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add Rental Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Property Name *
                </label>
                <Input
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  placeholder="Shop A-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="propertyType" className="text-sm font-medium text-foreground mb-2 block">
                  Property Type *
                </label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value as RentalProperty['propertyType'] })}
                  required
                >
                  <SelectTrigger id="propertyType" className="w-full">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tenant Name *
                </label>
                <Input
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tenant Contact
                </label>
                <Input
                  value={formData.tenantContact}
                  onChange={(e) => setFormData({ ...formData, tenantContact: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Monthly Rent (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  placeholder="25000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Security Deposit (₹)
                </label>
                <Input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  placeholder="100000"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Lease Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.leaseStartDate}
                  onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="rentDueDay" className="text-sm font-medium text-foreground mb-2 block">
                  Rent Due Day *
                </label>
                <Select
                  value={formData.rentDueDay.toString()}
                  onValueChange={(value) => setFormData({ ...formData, rentDueDay: value })}
                  required
                >
                  <SelectTrigger id="rentDueDay" className="w-full">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Address *
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="MG Road, Bangalore"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Note
              </label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Property
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
