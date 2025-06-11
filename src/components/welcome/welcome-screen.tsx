
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // Show tagline after app name animation
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 800);

    // Auto-transition after 2 seconds
    const transitionTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(transitionTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
    >
      <div className="text-center">
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
          className="mb-6 flex justify-center"
        >
          <div className="p-4 rounded-2xl bg-gradient-blue shadow-2xl">
            <Leaf className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold text-foreground mb-2"
        >
          Savora
        </motion.h1>

        {/* Tagline */}
        {showTagline && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-muted-foreground font-medium"
          >
            Smart personal finance for real life
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
