
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Leaf, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after initial animation
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 600);

    return () => {
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* App Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            duration: 0.6 
          }}
          className="mb-8 flex justify-center"
        >
          <div className="p-6 rounded-3xl bg-gradient-blue shadow-2xl">
            <Leaf className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl font-bold text-foreground mb-4 tracking-tight"
        >
          Savora
        </motion.h1>

        {/* Updated Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-xl text-muted-foreground font-medium mb-8"
        >
          Grow your money, mindfully.
        </motion.p>

        {/* Content */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Get Started Button */}
            <Button
              onClick={onComplete}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-blue hover:opacity-90 transition-opacity shadow-soft"
            >
              Get Started
            </Button>

            {/* GitHub Link */}
            <motion.a
              href="https://github.com/savora-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-4 h-4" />
              <span className="text-sm">View on GitHub</span>
            </motion.a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
