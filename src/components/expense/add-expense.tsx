
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";

export function AddExpense() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const { toast } = useToast();

  const categories = [
    "Food", "Transport", "Shopping", "Bills", "Entertainment", 
    "Health", "Education", "Travel", "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Store expense locally (will be enhanced with proper storage later)
    const expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date: new Date().toISOString(),
    };

    const existingExpenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    existingExpenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(existingExpenses));

    toast({
      title: "Success",
      description: "Expense added successfully!",
    });

    // Reset form
    setAmount("");
    setDescription("");
    setCategory("Food");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <div className="pt-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 text-readable">
            Add Expense
          </h1>
          <p className="text-muted-foreground text-readable-muted">
            Track your spending easily
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card rounded-2xl p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block text-readable">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl h-14 text-center bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block text-readable">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you spend on?"
                className="bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block text-readable">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      p-3 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm
                      ${category === cat 
                        ? "bg-primary text-primary-foreground shadow-lg border-2 border-primary/30" 
                        : "bg-background/30 text-foreground border border-border/30 hover:bg-background/50"
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-gradient-blue hover:opacity-90 transition-opacity shadow-lg"
            >
              Add Expense
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
