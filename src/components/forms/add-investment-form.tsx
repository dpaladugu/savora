
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
import { InvestmentManager } from "@/services/investment-manager";
import { useAuth } from "@/contexts/auth-context";

const investmentSchema = z.object({
  name: z.string().min(1, "Investment name is required"),
  type: z.enum(['stocks', 'mutual_funds', 'bonds', 'fixed_deposit', 'real_estate', 'crypto', 'others']),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  units: z.number().optional(),
  price: z.number().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  maturityDate: z.string().optional(),
  expectedReturn: z.number().optional(),
  riskLevel: z.enum(['low', 'medium', 'high'])
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface AddInvestmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddInvestmentForm({ onSuccess, onCancel }: AddInvestmentFormProps) {
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
      riskLevel: 'medium'
    }
  });

  const onSubmit = async (data: InvestmentFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add investments",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await InvestmentManager.addInvestment(user.uid, data);
      
      toast({
        title: "Success",
        description: "Investment added successfully!"
      });

      reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add investment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Add Investment
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Investment Name</Label>
            <Input
              id="name"
              placeholder="e.g., HDFC Large Cap Fund"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Investment Type</Label>
            <Select onValueChange={(value) => setValue('type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {InvestmentManager.getInvestmentTypes().map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Invested (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="units">Units (Optional)</Label>
              <Input
                id="units"
                type="number"
                step="0.001"
                placeholder="0"
                {...register('units', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              {...register('purchaseDate')}
            />
            {errors.purchaseDate && (
              <p className="text-sm text-destructive">{errors.purchaseDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskLevel">Risk Level</Label>
            <Select onValueChange={(value) => setValue('riskLevel', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                {InvestmentManager.getRiskLevels().map(risk => (
                  <SelectItem key={risk.value} value={risk.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: risk.color }}
                      />
                      {risk.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.riskLevel && (
              <p className="text-sm text-destructive">{errors.riskLevel.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedReturn">Expected Return (% per annum)</Label>
            <Input
              id="expectedReturn"
              type="number"
              step="0.1"
              placeholder="12.0"
              {...register('expectedReturn', { valueAsNumber: true })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adding..." : "Add Investment"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
