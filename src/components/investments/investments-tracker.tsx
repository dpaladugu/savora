import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit, TrendingUp, TrendingDown, DollarSign, CalendarIcon, PieChart } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InvestmentService } from "@/services/InvestmentService";
import { useAuth } from "@/services/auth-service";
import type { InvestmentData } from "@/types/jsonPreload";

interface Investment {
  id: string;
  name: string;
  type: 'stocks' | 'bonds' | 'mutual_funds' | 'etf' | 'crypto' | 'real_estate' | 'other';
  symbol?: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: Date;
  platform: string;
  notes?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface InvestmentFormData {
  name: string;
  type: Investment['type'];
  symbol: string;
  quantity: string;
  purchase_price: string;
  current_price: string;
  purchase_date: Date;
  platform: string;
  notes: string;
}

const initialFormData: InvestmentFormData = {
  name: '',
  type: 'stocks',
  symbol: '',
  quantity: '',
  purchase_price: '',
  current_price: '',
  purchase_date: new Date(),
  platform: '',
  notes: ''
};

const investmentTypes = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' }
];

export function InvestmentsTracker() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [formData, setFormData] = useState<InvestmentFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  const loadInvestments = async () => {
    if (!user) return;
    
    try {
      const data = await InvestmentService.getAll(user.uid);
      const transformedData: Investment[] = data.map(investment => ({
        id: investment.id || '',
        name: investment.fund_name || investment.fund_name || 'Unnamed Investment',
        type: (investment.investment_type as Investment['type']) || 'other',
        symbol: investment.fund_name || '',
        quantity: investment.amount || 0,
        purchase_price: investment.amount || 0,
        current_price: investment.current_value || investment.amount || 0,
        purchase_date: new Date(investment.purchaseDate || new Date()),
        platform: investment.source || '',
        notes: investment.fund_name || '',
        user_id: investment.user_id || user.uid,
        created_at: new Date(investment.created_at || new Date()),
        updated_at: new Date(investment.updated_at || new Date())
      }));
      setInvestments(transformedData);
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Failed to load investments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const investmentData = {
        fund_name: formData.name,
        investment_type: formData.type,
        amount: parseFloat(formData.purchase_price) * parseFloat(formData.quantity) || 0,
        current_value: parseFloat(formData.current_price) * parseFloat(formData.quantity) || 0,
        purchaseDate: formData.purchase_date.toISOString().split('T')[0],
        user_id: user.uid,
        name: formData.name,
        source: formData.platform,
        risk_level: 'medium'
      };

      if (editingId) {
        await InvestmentService.update(editingId, investmentData);
        toast.success('Investment updated successfully');
      } else {
        await InvestmentService.create(investmentData);
        toast.success('Investment added successfully');
      }

      setFormData(initialFormData);
      setEditingId(null);
      loadInvestments();
    } catch (error) {
      console.error('Error saving investment:', error);
      toast.error('Failed to save investment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setFormData({
      name: investment.name,
      type: investment.type,
      symbol: investment.symbol || '',
      quantity: investment.quantity.toString(),
      purchase_price: investment.purchase_price.toString(),
      current_price: investment.current_price.toString(),
      purchase_date: new Date(investment.purchase_date),
      platform: investment.platform,
      notes: investment.notes || ''
    });
    setEditingId(investment.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await InvestmentService.delete(id);
      toast.success('Investment deleted successfully');
      loadInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast.error('Failed to delete investment');
    }
  };

  const calculateTotalValue = () => {
    return investments.reduce((total, inv) => total + (inv.quantity * inv.current_price), 0);
  };

  const calculateTotalInvested = () => {
    return investments.reduce((total, inv) => total + (inv.quantity * inv.purchase_price), 0);
  };

  const calculateTotalGainLoss = () => {
    return calculateTotalValue() - calculateTotalInvested();
  };

  const getGainLossPercentage = () => {
    const invested = calculateTotalInvested();
    if (invested === 0) return 0;
    return ((calculateTotalGainLoss() / invested) * 100);
  };

  const getInvestmentsByType = () => {
    const typeMap = new Map();
    investments.forEach(inv => {
      const currentValue = inv.quantity * inv.current_price;
      if (typeMap.has(inv.type)) {
        typeMap.set(inv.type, typeMap.get(inv.type) + currentValue);
      } else {
        typeMap.set(inv.type, currentValue);
      }
    });
    return Array.from(typeMap.entries()).map(([type, value]) => ({
      type,
      value,
      percentage: (value / calculateTotalValue()) * 100
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalValue().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalInvested().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain/Loss</CardTitle>
            {calculateTotalGainLoss() >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateTotalGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${calculateTotalGainLoss().toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return %</CardTitle>
            {getGainLossPercentage() >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGainLossPercentage() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {getGainLossPercentage().toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="investments" className="w-full">
        <TabsList>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="add">Add Investment</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments.map((investment) => {
                  const currentValue = investment.quantity * investment.current_price;
                  const investedValue = investment.quantity * investment.purchase_price;
                  const gainLoss = currentValue - investedValue;
                  const gainLossPercentage = ((gainLoss / investedValue) * 100);

                  return (
                    <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{investment.name}</h3>
                          {investment.symbol && (
                            <Badge variant="outline">{investment.symbol}</Badge>
                          )}
                          <Badge variant="secondary">
                            {investmentTypes.find(t => t.value === investment.type)?.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Quantity:</span> {investment.quantity}
                          </div>
                          <div>
                            <span className="font-medium">Purchase Price:</span> ${investment.purchase_price.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Current Price:</span> ${investment.current_price.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Platform:</span> {investment.platform}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Current Value:</span> ${currentValue.toFixed(2)}
                          </div>
                          <div className={gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            <span className="font-medium">Gain/Loss:</span> ${gainLoss.toFixed(2)} ({gainLossPercentage.toFixed(2)}%)
                          </div>
                          <div>
                            <span className="font-medium">Purchase Date:</span> {format(new Date(investment.purchase_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        {investment.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Notes:</span> {investment.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(investment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(investment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {investments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No investments found. Add your first investment to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Investment' : 'Add New Investment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Investment Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Apple Inc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Investment Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Investment['type']) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {investmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol (Optional)</Label>
                    <Input
                      id="symbol"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      placeholder="e.g., AAPL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_price">Current Price</Label>
                    <Input
                      id="current_price"
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.purchase_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.purchase_date ? format(formData.purchase_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.purchase_date}
                          onSelect={(date) => date && setFormData({ ...formData, purchase_date: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform/Broker</Label>
                    <Input
                      id="platform"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      placeholder="e.g., Robinhood, TD Ameritrade"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this investment"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    {editingId ? 'Update Investment' : 'Add Investment'}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData(initialFormData);
                        setEditingId(null);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
                  <div className="space-y-2">
                    {getInvestmentsByType().map(({ type, value, percentage }) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {investmentTypes.find(t => t.value === type)?.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ${value.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
                  <div className="space-y-2">
                    {investments
                      .map(inv => ({
                        ...inv,
                        gainLossPercentage: (((inv.current_price - inv.purchase_price) / inv.purchase_price) * 100)
                      }))
                      .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
                      .slice(0, 5)
                      .map(investment => (
                        <div key={investment.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{investment.name}</span>
                            {investment.symbol && (
                              <Badge variant="outline" className="ml-2">{investment.symbol}</Badge>
                            )}
                          </div>
                          <div className={`font-semibold ${investment.gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {investment.gainLossPercentage >= 0 ? '+' : ''}{investment.gainLossPercentage.toFixed(2)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
