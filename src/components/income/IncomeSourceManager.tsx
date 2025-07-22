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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Edit, TrendingUp, CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { IncomeService } from "@/services/IncomeService";
import { useAuth } from "@/services/auth-service";

interface IncomeSourceData {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  start_date: string;
  end_date?: string;
  category: string;
  notes?: string;
  user_id: string;
}

const frequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-Time" },
];

export function IncomeSourceManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSourceData[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<IncomeSourceData | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchIncomeSources = async () => {
      try {
        const incomes = await IncomeService.getIncomes();
        // Map Income records to IncomeSourceData format
        const mappedIncomeSources = incomes.map(income => ({
          id: income.id || '',
          name: income.source_name || income.description || '',
          amount: income.amount,
          frequency: (income.frequency || 'one-time') as 'monthly' | 'yearly' | 'one-time',
          start_date: income.date,
          end_date: undefined,
          category: income.category,
          notes: income.description || '',
          user_id: income.user_id || ''
        }));
        setIncomeSources(mappedIncomeSources);
      } catch (error) {
        console.error("Failed to fetch income sources:", error);
        toast.error("Failed to fetch income sources.");
      }
    };

    fetchIncomeSources();
  }, [user]);

  const handleAddIncomeSource = async () => {
    if (!user) return;

    try {
      if (!name || !amount || !frequency || !startDate || !category) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const newIncomeData = {
        source_name: name,
        amount: Number(amount),
        frequency,
        date: startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        category,
        description: notes,
        user_id: user.uid,
      };

      await IncomeService.addIncome(newIncomeData);
      
      const newIncomeSource: IncomeSourceData = {
        id: "temp_" + Date.now(),
        name,
        amount: Number(amount),
        frequency,
        start_date: startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        category,
        notes,
        user_id: user.uid,
      };
      
      setIncomeSources([...incomeSources, newIncomeSource]);
      closeModal();
      toast.success("Income source added successfully!");
    } catch (error) {
      console.error("Failed to add income source:", error);
      toast.error("Failed to add income source.");
    }
  };

  const handleEditIncomeSource = async () => {
    if (!user || !selectedIncomeSource) return;

    try {
      if (!name || !amount || !frequency || !startDate || !category) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const updatedIncomeData = {
        source_name: name,
        amount: Number(amount),
        frequency,
        date: startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        category,
        description: notes,
        user_id: user.uid,
      };

      await IncomeService.updateIncome(selectedIncomeSource.id, updatedIncomeData);
      
      setIncomeSources(
        incomeSources.map((incomeSource) =>
          incomeSource.id === selectedIncomeSource.id 
            ? { ...incomeSource, name, amount: Number(amount), frequency, start_date: startDate?.toISOString().split('T')[0] || '', category, notes }
            : incomeSource
        )
      );
      closeModal();
      toast.success("Income source updated successfully!");
    } catch (error) {
      console.error("Failed to edit income source:", error);
      toast.error("Failed to edit income source.");
    }
  };

  const handleDeleteIncomeSource = async (id: string) => {
    try {
      await IncomeService.deleteIncome(id);
      setIncomeSources(incomeSources.filter((incomeSource) => incomeSource.id !== id));
      toast.success("Income source deleted successfully!");
    } catch (error) {
      console.error("Failed to delete income source:", error);
      toast.error("Failed to delete income source.");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setName("");
    setAmount("");
    setFrequency('monthly');
    setStartDate(undefined);
    setEndDate(undefined);
    setCategory("");
    setNotes("");
  };

  const openEditModal = (incomeSource: IncomeSourceData) => {
    setIsEditModalOpen(true);
    setSelectedIncomeSource(incomeSource);
    setName(incomeSource.name);
    setAmount(incomeSource.amount);
    setFrequency(incomeSource.frequency);
    setStartDate(new Date(incomeSource.start_date));
    setEndDate(incomeSource.end_date ? new Date(incomeSource.end_date) : undefined);
    setCategory(incomeSource.category);
    setNotes(incomeSource.notes || "");
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedIncomeSource(null);
    setName("");
    setAmount("");
    setFrequency('monthly');
    setStartDate(undefined);
    setEndDate(undefined);
    setCategory("");
    setNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Source Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Income Source
        </Button>
        <div className="mt-4">
          {incomeSources.length > 0 ? (
            <div className="grid gap-4">
              {incomeSources.map((incomeSource) => (
                <Card key={incomeSource.id} className="bg-muted">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{incomeSource.name}</h3>
                      <p className="text-sm text-gray-500">Amount: ${incomeSource.amount}</p>
                      <Badge variant="secondary">{incomeSource.frequency}</Badge>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(incomeSource)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteIncomeSource(incomeSource.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No income sources added yet.</p>
          )}
        </div>
      </CardContent>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Income Source</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setAmount(value === "" ? "" : Number(value));
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select onValueChange={(value) => setFrequency(value as 'monthly' | 'yearly' | 'one-time')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddIncomeSource}>
              Add Income Source
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Income Source</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
                    setAmount(value === "" ? "" : Number(value));
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Frequency
              </Label>
              <Select onValueChange={(value) => setFrequency(value as 'monthly' | 'yearly' | 'one-time')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 pl-3 text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditIncomeSource}>
              Update Income Source
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
