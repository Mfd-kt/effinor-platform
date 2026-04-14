import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UrgencyBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const diff = endOfMonth - now;

        if (diff < 0) {
            setTimeLeft("0j 0h 0m 0s");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto z-50 max-w-sm bg-red-500 dark:bg-red-600 text-white p-4 rounded-lg shadow-2xl"
      >
        <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 flex-shrink-0 animate-pulse" />
          <div>
            <p className="font-bold text-lg">Financement en cours d’épuisement !</p>
            <p className="text-sm">Offres 100% financées limitées. Demandez avant :</p>
            <p className="text-xl font-mono font-bold tracking-wider">{timeLeft}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UrgencyBanner;