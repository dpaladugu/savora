import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InvestmentService } from "@/services/InvestmentService"; // Use Dexie service
import { InvestmentData } from "@/types/jsonPreload"; // Use Dexie data type
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

// Schema to validate form fields. Aligns with InvestmentData structure where possible.
const investmentSchema = z.object({
  fund_name: z.string().min(1, "Investment name is required"),
  investment_type: z.string().min(1, "Investment type is required"),
  invested_value: z.number().optional(),
  current_value: z.number().optional(),
  quantity: z.number().optional(),
  purchaseDate: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface AddInvestmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: InvestmentData | null; // For editing
}

const INVESTMENT_TYPES = ['Mutual Fund', 'PPF', 'EPF', 'NPS', 'Gold', 'Stock', 'Other'];
const INVESTMENT_CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'Retirement', 'Commodity', 'Real Estate', 'Other'];

export function AddInvestmentForm({ onSuccess, onCancel, initialData }: AddInvestmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      investment_type: 'Mutual Fund',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        invested_value: initialData.invested_value || undefined,
        current_value: initialData.current_value || undefined,
        quantity: initialData.quantity || undefined,
        purchaseDate: initialData.purchaseDate || new Date().toISOString().split('T')[0],
      });
    } else {
      reset({
        fund_name: '',
        investment_type: 'Mutual Fund',
        category: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        invested_value: undefined,
        current_value: undefined,
        quantity: undefined,
        notes: '',
      });
    }
  }, [initialData, reset]);


  const onSubmit = async (data: InvestmentFormData) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to add investments", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const recordData: Omit<InvestmentData, 'id'> = {
        fund_name: data.fund_name,
        investment_type: data.investment_type,
        category: data.category,
        invested_value: data.invested_value,
        current_value: data.current_value,
        purchaseDate: data.purchaseDate,
        quantity: data.quantity,
        notes: data.notes,
        user_id: user.uid,
      };

      if (initialData?.id) {
        await InvestmentService.updateInvestment(initialData.id, recordData);
        toast({ title: "Success", description: "Investment updated successfully!" });
      } else {
        await InvestmentService.addInvestment(recordData);
        toast({ title: "Success", description: "Investment added successfully!" });
      }

      reset();
      onSuccess?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save investment. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto my-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {initialData ? 'Edit Investment' : 'Add Investment'}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close form">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fund_name">Investment Name/Fund *</Label>
            <Input id="fund_name" placeholder="e.g., HDFC Large Cap Fund" {...register('fund_name')} />
            {errors.fund_name && <p className="text-sm text-destructive">{errors.fund_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investment_type">Type *</Label>
              <Select onValueChange={(value) => setValue('investment_type', value)} defaultValue={initialData?.investment_type || 'Mutual Fund'}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{INVESTMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              {errors.investment_type && <p className="text-sm text-destructive">{errors.investment_type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('category', value)} defaultValue={initialData?.category}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{INVESTMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="invested_value">Amount Invested (₹)</Label>
              <Input id="invested_value" type="number" step="0.01" placeholder="0.00" {...register('invested_value', { valueAsNumber: true })} />
              {errors.invested_value && <p className="text-sm text-destructive">{errors.invested_value.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value (₹)</Label>
              <Input id="current_value" type="number" step="0.01" placeholder="0.00" {...register('current_value', { valueAsNumber: true })} />
              {errors.current_value && <p className="text-sm text-destructive">{errors.current_value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
              {errors.purchaseDate && <p className="text-sm text-destructive">{errors.purchaseDate.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="quantity">Quantity/Units</Label>
              <Input id="quantity" type="number" step="any" placeholder="0" {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Any additional notes..." {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : (initialData ? 'Update Investment' : 'Add Investment')}
            </Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
