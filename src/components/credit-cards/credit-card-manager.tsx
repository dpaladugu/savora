
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, CreditCard, Search, Trash2, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { useToast } from "@/hooks/use-toast";

export interface CreditCardData {
  id: string;
  name: string;
  limit: number;
  issuer: string;
  billCycle: number; // day of month
  autoDebit: boolean;
  currentBalance: number;
  dueDate: string;
}

const mockCreditCards: CreditCardData[] = [
  {
    id: '1',
    name: 'ICICI Amazon Pay',
    limit: 200000,
    issuer: 'ICICI Bank',
    billCycle: 15,
    autoDebit: true,
    currentBalance: 45000,
    dueDate: '2024-02-15'
  },
  {
    id: '2',
    name: 'HDFC Millennia',
    limit: 150000,
    issuer: 'HDFC Bank',
    billCycle: 5,
    autoDebit: false,
    currentBalance: 23000,
    dueDate: '2024-02-05'
  }
];

export function CreditCardManager() {
  const [cards, setCards] = useState<CreditCardData[]>(mockCreditCards);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleAddCard = (newCard: Omit<CreditCardData, 'id'>) => {
    const card: CreditCardData = {
      ...newCard,
      id: Date.now().toString()
    };
    
    setCards([card, ...cards]);
    setShowAddForm(false);
    
    // TODO: Firebase integration - save to Firestore
    console.log('TODO: Save credit card to Firestore:', card);
    
    toast({
      title: "Credit card added successfully",
      description: `${newCard.name} has been added to your wallet`,
    });
  };

  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
    // TODO: Firebase integration - delete from Firestore
    console.log('TODO: Delete credit card from Firestore:', id);
    toast({
      title: "Card removed",
    });
  };

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalUsed = cards.reduce((sum, card) => sum + card.currentBalance, 0);
  const utilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header section removed. Title/subtitle should be provided by ModuleHeader via router. */}
      {/* The "Add Card" button might be passed as an 'action' to ModuleHeader,
          or exist as a primary action button within this component's layout.
          For now, let's place it visibly if not in a header.
      */}
      <div className="flex justify-end"> {/* Simple placement for the button for now */}
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-blue hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Card
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
                <p className="text-sm text-muted-foreground">Total Limit</p>
                <p className="text-lg font-bold text-foreground">₹{totalLimit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${utilization > 70 ? 'bg-gradient-red' : 'bg-gradient-green'}`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-lg font-bold text-foreground">{utilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Card Form */}
      {showAddForm && (
        <AddCreditCardForm 
          onSubmit={handleAddCard}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search credit cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredCards.map((card, index) => (
          <motion.div
            key={card.id}
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
                        {card.name}
                      </h4>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {card.issuer}
                      </span>
                      {!card.autoDebit && (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Used:</span>
                        <span className="font-medium text-foreground">₹{card.currentBalance.toLocaleString()}</span>
                        <span className="text-muted-foreground">of</span>
                        <span className="font-medium text-foreground">₹{card.limit.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Due:</span>
                        <span className="font-medium text-foreground">{new Date(card.dueDate).toLocaleDateString('en-IN')}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Bill Cycle: {card.billCycle}th</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (card.currentBalance / card.limit) * 100 > 70 ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((card.currentBalance / card.limit) * 100, 100)}%` }}
                        />
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
                      onClick={() => handleDeleteCard(card.id)}
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
      {cards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Credit Cards</h3>
          <p className="text-muted-foreground mb-4">Add your first credit card</p>
          <Button onClick={() => setShowAddForm(true)} className="bg-gradient-blue hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Card
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AddCreditCardForm({ onSubmit, onCancel }: {
  onSubmit: (card: Omit<CreditCardData, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    issuer: '',
    billCycle: '',
    autoDebit: true,
    currentBalance: '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.limit || !formData.issuer || !formData.billCycle) {
      return;
    }

    onSubmit({
      name: formData.name,
      limit: parseFloat(formData.limit),
      issuer: formData.issuer,
      billCycle: parseInt(formData.billCycle),
      autoDebit: formData.autoDebit,
      currentBalance: formData.currentBalance ? parseFloat(formData.currentBalance) : 0,
      dueDate: formData.dueDate
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="metric-card border-border/50">
        <CardHeader>
          <CardTitle>Add Credit Card</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Card Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ICICI Amazon Pay"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Credit Limit (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="200000"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Issuer *
                </label>
                <Input
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="ICICI Bank"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Bill Cycle Day *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.billCycle}
                  onChange={(e) => setFormData({ ...formData, billCycle: e.target.value })}
                  placeholder="15"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Balance (₹)
                </label>
                <Input
                  type="number"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Next Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2"> {/* Added pt-2 for spacing */}
              <Checkbox
                id="autoDebit"
                checked={formData.autoDebit}
                onCheckedChange={(checked) => setFormData({ ...formData, autoDebit: !!checked })}
              />
              <label
                htmlFor="autoDebit"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-debit enabled
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Card
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
