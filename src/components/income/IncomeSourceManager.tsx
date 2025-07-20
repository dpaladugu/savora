import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit, DollarSign, CalendarIcon, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { IncomeSourceService } from "@/services/IncomeSourceService";
import { useAuth } from "@/services/auth-service";

interface IncomeSource {
  id: string;
  name: string;
  type: string;
  amount: number;
  description?: string;
  startDate?: Date;
}

const typeOptions = [
  { value: "salary", label: "Salary" },
  { value: "investment", label: "Investment" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

export function IncomeSourceManager() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<IncomeSource | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState(typeOptions[0].value);
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchIncomeSources = async () => {
      try {
        const sources = await IncomeSourceService.getIncomeSources(user.uid);
        setIncomeSources(sources);
      } catch (error: any) {
        toast.error(`Failed to fetch income sources: ${error.message}`);
      }
    };

    fetchIncomeSources();
  }, [user]);

  const handleAddIncomeSource = async () => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    if (!name || !type || !amount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber)) {
      toast.error("Amount must be a number.");
      return;
    }

    const newIncomeSource = {
      name,
      type,
      amount: amountNumber,
      description,
      startDate,
    };

    try {
      await IncomeSourceService.addIncomeSource(user.uid, newIncomeSource);
      const updatedIncomeSources = await IncomeSourceService.getIncomeSources(user.uid);
      setIncomeSources(updatedIncomeSources);
      toast.success("Income source added successfully!");
      closeModal();
    } catch (error: any) {
      toast.error(`Failed to add income source: ${error.message}`);
    }
  };

  const handleEditIncomeSource = async () => {
    if (!user || !selectedIncomeSource) {
      toast.error("User not authenticated or no income source selected.");
      return;
    }

    if (!name || !type || !amount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber)) {
      toast.error("Amount must be a number.");
      return;
    }

    const updatedIncomeSource = {
      ...selectedIncomeSource,
      name,
      type,
      amount: amountNumber,
      description,
      startDate,
    };

    try {
      await IncomeSourceService.updateIncomeSource(user.uid, updatedIncomeSource);
      const updatedIncomeSources = await IncomeSourceService.getIncomeSources(user.uid);
      setIncomeSources(updatedIncomeSources);
      toast.success("Income source updated successfully!");
      closeModal();
    } catch (error: any) {
      toast.error(`Failed to update income source: ${error.message}`);
    }
  };

  const handleDeleteIncomeSource = async (id: string) => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    try {
      await IncomeSourceService.deleteIncomeSource(user.uid, id);
      const updatedIncomeSources = await IncomeSourceService.getIncomeSources(user.uid);
      setIncomeSources(updatedIncomeSources);
      toast.success("Income source deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete income source: ${error.message}`);
    }
  };

  const openAddModal = () => {
    setName("");
    setType(typeOptions[0].value);
    setAmount("");
    setDescription("");
    setStartDate(undefined);
    setIsAddModalOpen(true);
  };

  const openEditModal = (incomeSource: IncomeSource) => {
    setSelectedIncomeSource(incomeSource);
    setName(incomeSource.name);
    setType(incomeSource.type);
    setAmount(incomeSource.amount);
    setDescription(incomeSource.description || "");
    setStartDate(incomeSource.startDate ? new Date(incomeSource.startDate) : undefined);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedIncomeSource(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={openAddModal} className="mb-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Income Source
        </Button>
        {incomeSources.length === 0 ? (
          <p>No income sources added yet.</p>
        ) : (
          <div className="grid gap-4">
            {incomeSources.map((incomeSource) => (
              <Card key={incomeSource.id}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{incomeSource.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{incomeSource.type}</Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <DollarSign className="inline-block h-4 w-4 mr-1" />
                        {incomeSource.amount}
                      </p>
                      {incomeSource.startDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                          {format(new Date(incomeSource.startDate), "MMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                    {incomeSource.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {incomeSource.description}
                      </p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditModal(incomeSource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteIncomeSource(incomeSource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Income Source Modal */}
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
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 pl-3 text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "MMM dd, yyyy") : <span>Pick a date</span>}
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
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddIncomeSource} className="ml-2">
                Add Income Source
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Income Source Modal */}
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
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right mt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 pl-3 text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "MMM dd, yyyy") : <span>Pick a date</span>}
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
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEditIncomeSource} className="ml-2">
                Update Income Source
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
