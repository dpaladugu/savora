
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { DarkModeToggle } from "../ui/dark-mode-toggle";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 transition-all duration-300 overflow-auto">
      <DarkModeToggle />
      
      <div className="pt-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-2"
        >
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Add Expense
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Track your spending easily
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="metric-card rounded-2xl p-6 mx-2"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl h-14 text-center bg-background/90 dark:bg-background/70 backdrop-blur-sm border-border/50 font-bold text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you spend on?"
                className="bg-background/90 dark:bg-background/70 backdrop-blur-sm border-border/50 h-12 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      p-3 rounded-xl text-sm font-semibold transition-all duration-200 backdrop-blur-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      ${category === cat 
                        ? "bg-primary text-primary-foreground shadow-soft border-primary/50" 
                        : "bg-background/70 dark:bg-background/50 text-foreground border-border/40 hover:bg-background/90 dark:hover:bg-background/70"
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
              className="w-full h-12 text-lg font-semibold bg-gradient-blue hover:opacity-90 transition-opacity shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Add Expense
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
