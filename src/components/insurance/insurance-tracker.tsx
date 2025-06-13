
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Shield, Search, Trash2, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface Insurance {
  id: string;
  policyName: string;
  policyNumber: string;
  insurer: string;
  type: 'life' | 'health' | 'vehicle' | 'home' | 'other';
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  coverageAmount: number;
  nextDueDate: string;
  status: 'active' | 'expired' | 'cancelled';
  note?: string;
}

export interface EMI {
  id: string;
  loanType: string;
  lender: string;
  principalAmount: number;
  emiAmount: number;
  interestRate: number;
  tenure: number;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  remainingAmount: number;
  status: 'active' | 'completed' | 'defaulted';
  note?: string;
}

const mockInsurances: Insurance[] = [
  {
    id: '1',
    policyName: 'Term Life Insurance',
    policyNumber: 'LI001234567',
    insurer: 'LIC of India',
    type: 'life',
    premium: 25000,
    frequency: 'yearly',
    startDate: '2023-01-15',
    endDate: '2043-01-15',
    coverageAmount: 5000000,
    nextDueDate: '2024-01-15',
    status: 'active'
  }
];

const mockEMIs: EMI[] = [
  {
    id: '1',
    loanType: 'Home Loan',
    lender: 'SBI',
    principalAmount: 5000000,
    emiAmount: 45000,
    interestRate: 8.5,
    tenure: 240,
    startDate: '2023-06-01',
    endDate: '2043-06-01',
    nextDueDate: '2024-02-01',
    remainingAmount: 4800000,
    status: 'active'
  }
];

export function InsuranceTracker() {
  const [insurances, setInsurances] = useState<Insurance[]>(mockInsurances);
  const [emis, setEMIs] = useState<EMI[]>(mockEMIs);
  const [activeTab, setActiveTab] = useState<'insurance' | 'emi'>('insurance');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddInsurance = (newInsurance: Omit<Insurance, 'id'>) => {
    const insurance: Insurance = {
      ...newInsurance,
      id: Date.now().toString()
    };
    
    setInsurances([insurance, ...insurances]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save insurance to Firestore:', insurance);
    
    toast({
      title: "Insurance policy added",
      description: `${newInsurance.policyName} added successfully`,
    });
  };

  const handleAddEMI = (newEMI: Omit<EMI, 'id'>) => {
    const emi: EMI = {
      ...newEMI,
      id: Date.now().toString()
    };
    
    setEMIs([emi, ...emis]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save EMI to Firestore:', emi);
    
    toast({
      title: "EMI added",
      description: `${newEMI.loanType} EMI added successfully`,
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalMonthlyPremiums = insurances
    .filter(ins => ins.frequency === 'monthly')
    .reduce((sum, ins) => sum + ins.premium, 0);

  const totalMonthlyEMIs = emis
    .filter(emi => emi.status === 'active')
    .reduce((sum, emi) => sum + emi.emiAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Insurance & EMI</h2>
          <p className="text-muted-foreground">Manage your policies and loans</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'insurance' ? 'Insurance' : 'EMI'}
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'insurance' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Insurance
        </button>
        <button
          onClick={() => setActiveTab('emi')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'emi' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EMI
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-purple text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Premiums</p>
                <p className="text-lg font-bold text-foreground">₹{totalMonthlyPremiums.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-orange text-white">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly EMIs</p>
                <p className="text-lg font-bold text-foreground">₹{totalMonthlyEMIs.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Forms */}
      {showAddForm && activeTab === 'insurance' && (
        <AddInsuranceForm 
          onSubmit={handleAddInsurance}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showAddForm && activeTab === 'emi' && (
        <AddEMIForm 
          onSubmit={handleAddEMI}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'insurance' ? (
        <InsuranceList insurances={insurances} />
      ) : (
        <EMIList emis={emis} />
      )}
    </div>
  );
}

function InsuranceList({ insurances }: { insurances: Insurance[] }) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'life': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'health': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'vehicle': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'home': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || colors['other'];
  };

  return (
    <div className="space-y-3">
      {insurances.map((insurance, index) => (
        <motion.div
          key={insurance.id}
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
                      {insurance.policyName}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(insurance.type)}`}>
                      {insurance.type}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Premium:</span>
                      <span className="font-medium text-foreground">₹{insurance.premium.toLocaleString()}/{insurance.frequency}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Coverage:</span>
                      <span className="font-medium text-foreground">₹{insurance.coverageAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className="font-medium text-foreground">{new Date(insurance.nextDueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{insurance.insurer} • {insurance.policyNumber}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function EMIList({ emis }: { emis: EMI[] }) {
  return (
    <div className="space-y-3">
      {emis.map((emi, index) => (
        <motion.div
          key={emi.id}
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
                      {emi.loanType}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {emi.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">EMI:</span>
                      <span className="font-medium text-foreground">₹{emi.emiAmount.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="font-medium text-foreground">₹{emi.remainingAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-medium text-foreground">{emi.interestRate}% p.a.</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className="font-medium text-foreground">{new Date(emi.nextDueDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{emi.lender}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AddInsuranceForm({ onSubmit, onCancel }: {
  onSubmit: (insurance: Omit<Insurance, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    policyName: '',
    policyNumber: '',
    insurer: '',
    type: 'life' as Insurance['type'],
    premium: '',
    frequency: 'yearly' as Insurance['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    coverageAmount: '',
    nextDueDate: '',
    status: 'active' as Insurance['status'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.policyName || !formData.premium || !formData.coverageAmount) {
      return;
    }

    onSubmit({
      policyName: formData.policyName,
      policyNumber: formData.policyNumber,
      insurer: formData.insurer,
      type: formData.type,
      premium: parseFloat(formData.premium),
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate,
      coverageAmount: parseFloat(formData.coverageAmount),
      nextDueDate: formData.nextDueDate,
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
          <CardTitle>Add Insurance Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Policy Name *
                </label>
                <Input
                  value={formData.policyName}
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                  placeholder="Term Life Insurance"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Policy Number
                </label>
                <Input
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  placeholder="LI001234567"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Insurance['type'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="life">Life</option>
                  <option value="health">Health</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Premium (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                  placeholder="25000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Coverage Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.coverageAmount}
                  onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                  placeholder="5000000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Insurance['frequency'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Insurance
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

function AddEMIForm({ onSubmit, onCancel }: {
  onSubmit: (emi: Omit<EMI, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    loanType: '',
    lender: '',
    principalAmount: '',
    emiAmount: '',
    interestRate: '',
    tenure: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    nextDueDate: '',
    remainingAmount: '',
    status: 'active' as EMI['status'],
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loanType || !formData.emiAmount || !formData.principalAmount) {
      return;
    }

    onSubmit({
      loanType: formData.loanType,
      lender: formData.lender,
      principalAmount: parseFloat(formData.principalAmount),
      emiAmount: parseFloat(formData.emiAmount),
      interestRate: parseFloat(formData.interestRate),
      tenure: parseInt(formData.tenure),
      startDate: formData.startDate,
      endDate: formData.endDate,
      nextDueDate: formData.nextDueDate,
      remainingAmount: parseFloat(formData.remainingAmount || formData.principalAmount),
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
          <CardTitle>Add EMI</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Loan Type *
                </label>
                <Input
                  value={formData.loanType}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                  placeholder="Home Loan"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Lender *
                </label>
                <Input
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder="SBI"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Principal Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.principalAmount}
                  onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                  placeholder="5000000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  EMI Amount (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                  placeholder="45000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Interest Rate (% p.a.)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="8.5"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tenure (months)
                </label>
                <Input
                  type="number"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  placeholder="240"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add EMI
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
