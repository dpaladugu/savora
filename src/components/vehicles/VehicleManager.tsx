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
import { Trash2, Plus, Edit, Car, Truck, Bike, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VehicleService } from "@/services/VehicleService";
import { useAuth } from "@/services/auth-service";

interface Vehicle {
  id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  purchaseDate: Date | null;
  purchasePrice: number;
  notes: string;
}

const initialVehicleState: Vehicle = {
  id: "",
  type: "Car",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  purchaseDate: null,
  purchasePrice: 0,
  notes: "",
};

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(initialVehicleState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Vehicle>(initialVehicleState);
  const [activeTab, setActiveTab] = useState("list");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      if (!auth.user) {
        console.warn("User not authenticated.");
        return;
      }
      const fetchedVehicles = await VehicleService.getAll(auth.user.uid);
      setVehicles(fetchedVehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setNewVehicle(prev => ({ ...prev, purchaseDate: date || null }));
  };

  const openAddModal = () => {
    setNewVehicle(initialVehicleState);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedVehicle(initialVehicleState);
  };

  const openDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedVehicle(initialVehicleState);
  };

  const addVehicle = async () => {
    try {
      if (!auth.user) {
        console.warn("User not authenticated.");
        return;
      }
      await VehicleService.create({ ...newVehicle, purchaseDate: newVehicle.purchaseDate ? newVehicle.purchaseDate : null, userId: auth.user.uid });
      fetchVehicles();
      closeAddModal();
      toast.success("Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error("Failed to add vehicle.");
    }
  };

  const updateVehicle = async () => {
    try {
      if (!auth.user) {
        console.warn("User not authenticated.");
        return;
      }
      await VehicleService.update(selectedVehicle.id, { ...selectedVehicle, purchaseDate: selectedVehicle.purchaseDate ? selectedVehicle.purchaseDate : null, userId: auth.user.uid });
      fetchVehicles();
      closeEditModal();
      toast.success("Vehicle updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Failed to update vehicle.");
    }
  };

  const deleteVehicle = async () => {
    try {
      await VehicleService.delete(selectedVehicle.id);
      fetchVehicles();
      closeDeleteModal();
      toast.success("Vehicle deleted successfully!");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list" onClick={() => setActiveTab("list")}>List</TabsTrigger>
            <TabsTrigger value="add" onClick={() => setActiveTab("add")}>Add Vehicle</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="grid gap-4">
              {vehicles.map(vehicle => (
                <Card key={vehicle.id} className="border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{vehicle.make} {vehicle.model}</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(vehicle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteModal(vehicle)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Type: {vehicle.type}</p>
                    <p className="text-sm text-muted-foreground">Year: {vehicle.year}</p>
                  </CardContent>
                </Card>
              ))}
              {vehicles.length === 0 && <p>No vehicles added yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="add">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => handleSelectChange(value, "type")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="make">Make</Label>
                <Input id="make" name="make" value={newVehicle.make} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" value={newVehicle.model} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  type="number"
                  id="year"
                  name="year"
                  value={newVehicle.year}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !newVehicle.purchaseDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newVehicle.purchaseDate ? (
                        format(newVehicle.purchaseDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center" side="bottom">
                    <Calendar
                      mode="single"
                      selected={newVehicle.purchaseDate}
                      onSelect={handleDateChange}
                      disabled={false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  value={newVehicle.purchasePrice}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" value={newVehicle.notes} onChange={handleInputChange} />
              </div>
              <Button onClick={addVehicle}>Add Vehicle</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-zinc-500/50 dark:bg-zinc-800/50 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Edit Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={selectedVehicle.type} onValueChange={(value) => setSelectedVehicle(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Bike">Bike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="edit-make"
                    name="make"
                    value={selectedVehicle.make}
                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, make: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="edit-model"
                    name="model"
                    value={selectedVehicle.model}
                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    type="number"
                    id="edit-year"
                    name="year"
                    value={selectedVehicle.year}
                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !selectedVehicle.purchaseDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedVehicle.purchaseDate ? (
                          format(selectedVehicle.purchaseDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="bottom">
                      <Calendar
                        mode="single"
                        selected={selectedVehicle.purchaseDate}
                        onSelect={(date) => setSelectedVehicle(prev => ({ ...prev, purchaseDate: date || null }))}
                        disabled={false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    type="number"
                    id="edit-purchasePrice"
                    name="purchasePrice"
                    value={selectedVehicle.purchasePrice}
                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    name="notes"
                    value={selectedVehicle.notes}
                    onChange={(e) => setSelectedVehicle(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="secondary" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button onClick={updateVehicle}>Update Vehicle</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-zinc-500/50 dark:bg-zinc-800/50 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Delete Vehicle</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p>Are you sure you want to delete {selectedVehicle.make} {selectedVehicle.model}?</p>
                <div className="flex justify-end space-x-2">
                  <Button variant="secondary" onClick={closeDeleteModal}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={deleteVehicle}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
