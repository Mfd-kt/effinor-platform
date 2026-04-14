import React, { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Search bar avec debounce et recherche en temps réel
 */
const LeadSearch = ({ value, onChange, placeholder = "Rechercher (nom, entreprise, email, téléphone)...", className = "" }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedValue = useDebounce(localValue, 300);

  // Sync with external value
  useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      setIsSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        onChange?.(debouncedValue);
        setIsSearching(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [debouncedValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
        aria-label="Rechercher des leads"
      />
      <AnimatePresence>
        {localValue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-10 top-1/2 transform -translate-y-1/2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadSearch;




















