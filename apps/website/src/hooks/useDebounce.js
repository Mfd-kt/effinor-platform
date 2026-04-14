import { useState, useEffect } from 'react';

/**
 * Hook pour debounce une valeur
 * @param {any} value - La valeur à debounce
 * @param {number} delay - Le délai en millisecondes (par défaut 300ms)
 * @returns {any} La valeur debounced
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant le délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;



























