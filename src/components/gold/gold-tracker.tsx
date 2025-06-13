
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Coins, Search, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface GoldInvestment {
  id: string;
  weight: number; // in grams
  purity: '995' | '999' | '916' | '750' | 'other';
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: string;
  paymentMethod: string;
  storageLocation: string;
  form: 'coins' | 'bars' | 'jewelry' | 'etf' | 'other';
  vendor?: string;
  note?: string;
}

const mockGoldInvestments: GoldInvestment[] = [
  {
    id: '1',
    weight: 10,
    purity: '999',
    purchasePrice: 65000,
    currentPrice: 68000,
    purchaseDate: '2023-12-15',
    paymentMethod: 'Bank Transfer',
    storageLocation: 'Bank Locker',
    form: 'coins',
    vendor: 'MMTC-PAMP'
  },
  {
    id: '2',
    weight: 50,
    purity: '995',
    purchasePrice: 320000,
    currentPrice: 335000,
    purchaseDate: '2023-10-20',
    paymentMethod: 'Cash',
    storageLocation: 'Home Safe',
    form: 'bars',
    vendor: 'Local Jeweller'
  }
];

export function GoldTracker() {
  const [investments, setInvestments] = useState<GoldInvestment[]>(mockGoldInvestments);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddInvestment = (newInvestment: Omit<GoldInvestment, 'id'>) => {
    const investment: GoldInvestment = {
      ...newInvestment,
      id: Date.now().toString()
    };
    
    setInvestments([investment, ...investments]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save gold investment to Firestore:', investment);
    
    toast({
      title: "Gold investment added",
      description: `${newInvestment.weight}g of ${newInvestment.purity} purity gold`,
    });
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete gold investment from Firestore:', id);
    toast({
      title: "Investment deleted",
    });
  };

  const filteredInvestments = investments.filter(investment =>
    investment.form.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.storageLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWeight = investments.reduce((sum, inv) => sum + inv.weight, 0);
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.purchasePrice, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentPrice || inv.purchasePrice), 0);
  const totalGainLoss = totalCurrentValue - totalInvestment;

  const getFormColor = (form: string) => {
    const colors: Record<string, string> = {
      'coins': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bars': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'jewelry': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'etf': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[form] || colors['other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gold Investments</h2>
          <p className="text-muted-foreground">Track your physical gold holdings</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Gold
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-orange text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-lg font-bold text-foreground">{totalWeight}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold text-foreground">₹{totalCurrentValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment</p>
                <p className="text-lg font-bold text-foreground">₹{totalInvestment.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${totalGainLoss >= 0 ? 'bg-gradient-green' : 'bg-gradient-red'}`}>
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gain/Loss</p>
                <p className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}₹{totalGainLoss.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <AddGoldForm 
          onSubmit={handleAddInvestment}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search gold investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Investment List */}
      <div className="space-y-3">
        {filteredInvestments.map((investment, index) => (
          <motion.div
            key={investment.id}
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
                        {investment.weight}g Gold
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormColor(investment.form)}`}>
                        {investment.form}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {investment.purity} purity
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Purchase:</span>
                        <span className="font-medium text-foreground">₹{investment.purchasePrice.toLocaleString()}</span>
                        {investment.currentPrice && (
                          <>
                            <span className="text-muted-foreground">Current:</span>
                            <span className="font-medium text-foreground">₹{investment.currentPrice.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Storage:</span>
                        <span className="font-medium text-foreground">{investment.storageLocation}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{new Date(investment.purchaseDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      {investment.vendor && (
                        <p className="text-xs text-muted-foreground">Vendor: {investment.vendor}</p>
                      )}
                      {investment.note && (
                        <p className="text-sm text-muted-foreground">{investment.note}</p>
                      )}
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
                      onClick={() => handleDeleteInvestment(investment.id)}
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
      {investments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Gold Investments Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your gold portfolio</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Investment
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AddGoldForm({ onSubmit, onCancel }: {
  onSubmit: (investment: Omit<GoldInvestment, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    weight: '',
    purity: '999' as GoldInvestment['purity'],
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    storageLocation: '',
    form: 'coins' as GoldInvestment['form'],
    vendor: '',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.weight || !formData.purchasePrice || !formData.storageLocation) {
      return;
    }

    onSubmit({
      weight: parseFloat(formData.weight),
      purity: formData.purity,
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : undefined,
      purchaseDate: formData.purchaseDate,
      paymentMethod: formData.paymentMethod,
      storageLocation: formData.storageLocation,
      form: formData.form,
      vendor: formData.vendor || undefined,
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
          <CardTitle>Add Gold Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Weight (grams) *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purity *
                </label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value as GoldInvestment['purity'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="999">999 (99.9%)</option>
                  <option value="995">995 (99.5%)</option>
                  <option value="916">916 (91.6%)</option>
                  <option value="750">750 (75.0%)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purchase Price (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="65000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Price (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                  placeholder="68000"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Form *
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value as GoldInvestment['form'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="coins">Coins</option>
                  <option value="bars">Bars</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="etf">ETF</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Storage Location *
                </label>
                <Input
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  placeholder="Bank Locker"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Payment Method *
                </label>
                <Input
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="Bank Transfer"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Purchase Date *
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Vendor
                </label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="MMTC-PAMP"
                />
              </div>
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
                Add Investment
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
