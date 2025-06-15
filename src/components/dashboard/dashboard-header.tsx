
import { motion } from "framer-motion";

export function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 px-2"
    >
      <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm">
        Your financial overview
      </p>
    </motion.div>
  );
}
