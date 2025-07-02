
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, CreditCard, Wallet, Search, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'Wallet';
  balance: number;
  accountNumber?: string;
  provider: string; // Bank name or Wallet provider
  isActive: boolean;
}

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'ICICI Savings',
    type: 'Bank',
    balance: 125000,
    accountNumber: '****1234',
    provider: 'ICICI Bank',
    isActive: true
  },
  {
    id: '2',
    name: 'PhonePe Wallet',
    type: 'Wallet',
    balance: 5000,
    provider: 'PhonePe',
    isActive: true
  },
  {
    id: '3',
    name: 'Paytm Wallet',
    type: 'Wallet',
    balance: 2500,
    provider: 'Paytm',
    isActive: true
  }
];

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddAccount = (newAccount: Omit<Account, 'id'>) => {
    const account: Account = {
      ...newAccount,
      id: Date.now().toString()
    };
    
    setAccounts([account, ...accounts]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save account to Firestore:', account);
    
    toast({
      title: "Account added successfully",
      description: `${newAccount.name} has been added`,
    });
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete account from Firestore:', id);
    toast({
      title: "Account removed",
    });
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const bankAccounts = accounts.filter(acc => acc.type === 'Bank');
  const walletAccounts = accounts.filter(acc => acc.type === 'Wallet');

  return (
    <div className="space-y-6">
      {/* Header section removed. Title/subtitle should be provided by ModuleHeader via router. */}
      {/* The "Add Account" button might be passed as an 'action' to ModuleHeader,
          or exist as a primary action button within this component's layout.
          For now, let's place it visibly if not in a header.
      */}
      <div className="flex justify-end"> {/* Simple placement for the button for now */}
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-blue text-white">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-lg font-bold text-foreground">₹{totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-green text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-lg font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <AddAccountForm 
          onSubmit={handleAddAccount}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {filteredAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="metric-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg text-white ${
                        account.type === 'Bank' ? 'bg-gradient-blue' : 'bg-gradient-purple'
                      }`}>
                        {account.type === 'Bank' ? 
                          <CreditCard className="w-4 h-4" /> : 
                          <Wallet className="w-4 h-4" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">
                          {account.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{account.provider}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.type === 'Bank' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {account.type}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className="font-medium text-foreground text-lg">₹{account.balance.toLocaleString()}</span>
                      </div>
                      {account.accountNumber && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium text-foreground">{account.accountNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          account.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {account.isActive ? 'Active' : 'Inactive'}
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
                      onClick={() => handleDeleteAccount(account.id)}
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
      {accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Accounts</h3>
          <p className="text-muted-foreground mb-4">Add your first account</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Account
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AddAccountForm({ onSubmit, onCancel }: {
  onSubmit: (account: Omit<Account, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank' as Account['type'],
    balance: '',
    accountNumber: '',
    provider: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.provider) {
      return;
    }

    onSubmit({
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      accountNumber: formData.accountNumber || undefined,
      provider: formData.provider,
      isActive: formData.isActive
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Account Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ICICI Savings"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Account['type'] })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Wallet">Digital Wallet</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Provider *
                </label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="ICICI Bank / PhonePe"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Balance (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="125000"
                />
              </div>
              
              {formData.type === 'Bank' && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Account Number
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="****1234"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                Account is active
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Account
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
