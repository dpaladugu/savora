import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { AccountService } from "@/services/AccountService";
import { useAuth } from "@/services/auth-service";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export function AccountManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("checking");

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    AccountService.getAccounts(user.uid)
      .then((data) => {
        setAccounts(data);
      })
      .catch((error) => {
        toast.error("Failed to load accounts: " + error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("Account name cannot be empty");
      return;
    }
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    try {
      setLoading(true);
      const created = await AccountService.createAccount(user.uid, {
        name: newAccountName.trim(),
        type: newAccountType,
        balance: 0,
      });
      setAccounts((prev) => [...prev, created]);
      setNewAccountName("");
      setNewAccountType("checking");
      toast.success("Account created");
    } catch (error: any) {
      toast.error("Failed to create account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    try {
      setLoading(true);
      await AccountService.deleteAccount(user.uid, id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      toast.success("Account deleted");
    } catch (error: any) {
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (id: string, updatedFields: Partial<Account>) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    try {
      setLoading(true);
      const updated = await AccountService.updateAccount(user.uid, id, updatedFields);
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, ...updated } : acc))
      );
      toast.success("Account updated");
    } catch (error: any) {
      toast.error("Failed to update account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex space-x-2">
            <Input
              placeholder="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              disabled={loading}
            />
            <Select
              value={newAccountType}
              onValueChange={(value) => setNewAccountType(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddAccount} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          {loading && <p>Loading...</p>}
          {!loading && accounts.length === 0 && <p>No accounts found.</p>}
          <ul>
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">{account.type}</Badge>
                  <Input
                    value={account.name}
                    onChange={(e) =>
                      handleUpdateAccount(account.id, { name: e.target.value })
                    }
                    className="w-48"
                    disabled={loading}
                  />
                  <Input
                    type="number"
                    value={account.balance}
                    onChange={(e) =>
                      handleUpdateAccount(account.id, { balance: Number(e.target.value) })
                    }
                    className="w-32"
                    disabled={loading}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
