
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
import { 
  Trash2, 
  Plus, 
  Edit, 
  Shield, 
  Car, 
  Home, 
  Heart, 
  Briefcase, 
  CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar as CalendarLucide,
  TrendingUp,
  AlertCircle,
  Info,
  X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InsuranceService } from "@/services/InsuranceService";
import { useAuth } from "@/services/auth-service";

interface InsurancePolicy {
  id: string;
  type: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export function InsuranceTracker() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchPolicies() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await InsuranceService.getPolicies(user.uid);
        // Map the data to match our interface
        const mappedPolicies = data.map(policy => ({
          id: policy.id || '',
          type: policy.type || '',
          provider: policy.provider || policy.company_name || '',
          policyNumber: policy.policy_number || '',
          coverageAmount: policy.coverage_amount || 0,
          premium: policy.premium || 0,
          startDate: new Date(policy.start_date || new Date()),
          endDate: new Date(policy.end_date || new Date()),
          notes: policy.notes || ''
        }));
        setPolicies(mappedPolicies);
      } catch (error) {
        toast.error("Failed to load insurance policies.");
        console.error("InsuranceTracker: Error fetching policies", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, [user]);

  const handleAddPolicy = () => {
    setSelectedPolicy({
      id: "",
      type: "",
      provider: "",
      policyNumber: "",
      coverageAmount: 0,
      premium: 0,
      startDate: new Date(),
      endDate: new Date(),
      notes: ""
    });
    setIsEditing(true);
  };

  const handleEditPolicy = (policy: InsurancePolicy) => {
    setSelectedPolicy(policy);
    setIsEditing(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (!user) return;
    try {
      await InsuranceService.deletePolicy(id);
      setPolicies(policies.filter(p => p.id !== id));
      toast.success("Policy deleted.");
    } catch (error) {
      toast.error("Failed to delete policy.");
      console.error("InsuranceTracker: Error deleting policy", error);
    }
  };

  const handleSavePolicy = async () => {
    if (!user || !selectedPolicy) return;
    try {
      const policyData = {
        type: selectedPolicy.type,
        provider: selectedPolicy.provider,
        company_name: selectedPolicy.provider,
        policy_number: selectedPolicy.policyNumber,
        coverage_amount: selectedPolicy.coverageAmount,
        premium: selectedPolicy.premium,
        start_date: selectedPolicy.startDate.toISOString().split('T')[0],
        end_date: selectedPolicy.endDate.toISOString().split('T')[0],
        notes: selectedPolicy.notes || '',
        user_id: user.uid
      };

      if (selectedPolicy.id) {
        // Update existing
        await InsuranceService.updatePolicy(selectedPolicy.id, policyData);
        setPolicies(policies.map(p => p.id === selectedPolicy.id ? selectedPolicy : p));
        toast.success("Policy updated.");
      } else {
        // Create new
        const newPolicy = await InsuranceService.addPolicy(policyData);
        const mappedPolicy = {
          id: newPolicy.id || '',
          type: newPolicy.type || '',
          provider: newPolicy.provider || newPolicy.company_name || '',
          policyNumber: newPolicy.policy_number || '',
          coverageAmount: newPolicy.coverage_amount || 0,
          premium: newPolicy.premium || 0,
          startDate: new Date(newPolicy.start_date || new Date()),
          endDate: new Date(newPolicy.end_date || new Date()),
          notes: newPolicy.notes || ''
        };
        setPolicies([...policies, mappedPolicy]);
        toast.success("Policy added.");
      }
      setIsEditing(false);
      setSelectedPolicy(null);
    } catch (error) {
      toast.error("Failed to save policy.");
      console.error("InsuranceTracker: Error saving policy", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedPolicy(null);
  };

  const handleChange = (field: keyof InsurancePolicy, value: any) => {
    if (!selectedPolicy) return;
    setSelectedPolicy({ ...selectedPolicy, [field]: value });
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Insurance Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading policies...</p>
          ) : (
            <>
              <Button onClick={handleAddPolicy} className="mb-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Policy
              </Button>
              {policies.length === 0 ? (
                <p>No insurance policies found.</p>
              ) : (
                <div className="space-y-4">
                  {policies.map(policy => (
                    <div key={policy.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                        <Badge variant="secondary" className="mb-2 md:mb-0">{policy.type}</Badge>
                        <div>
                          <p className="font-semibold">{policy.provider}</p>
                          <p className="text-sm text-muted-foreground">Policy #: {policy.policyNumber}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-2 md:mt-0">
                        <Button variant="outline" size="sm" onClick={() => handleEditPolicy(policy)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeletePolicy(policy.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isEditing && selectedPolicy && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedPolicy.id ? "Edit Policy" : "Add Policy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={selectedPolicy.type}
                  onChange={e => handleChange("type", e.target.value)}
                  placeholder="e.g. Health, Auto, Home"
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={selectedPolicy.provider}
                  onChange={e => handleChange("provider", e.target.value)}
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={selectedPolicy.policyNumber}
                  onChange={e => handleChange("policyNumber", e.target.value)}
                  placeholder="Policy number"
                />
              </div>
              <div>
                <Label htmlFor="coverageAmount">Coverage Amount</Label>
                <Input
                  id="coverageAmount"
                  type="number"
                  value={selectedPolicy.coverageAmount}
                  onChange={e => handleChange("coverageAmount", Number(e.target.value))}
                  placeholder="Coverage amount"
                />
              </div>
              <div>
                <Label htmlFor="premium">Premium</Label>
                <Input
                  id="premium"
                  type="number"
                  value={selectedPolicy.premium}
                  onChange={e => handleChange("premium", Number(e.target.value))}
                  placeholder="Premium amount"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={format(selectedPolicy.startDate, "yyyy-MM-dd")}
                  onChange={e => handleChange("startDate", new Date(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={format(selectedPolicy.endDate, "yyyy-MM-dd")}
                  onChange={e => handleChange("endDate", new Date(e.target.value))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={selectedPolicy.notes || ""}
                  onChange={e => handleChange("notes", e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button onClick={handleSavePolicy}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
