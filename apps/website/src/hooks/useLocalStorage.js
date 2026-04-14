import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

function getStorageValue(key, defaultValue) {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(key);
    try {
      const initial = saved !== null ? JSON.parse(saved) : defaultValue;
      return initial;
    } catch (error) {
      logger.error("Error parsing JSON from localStorage", error);
      return defaultValue;
    }
  }
  return defaultValue;
}

export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error("Error setting item to localStorage", error);
    }
  }, [key, value]);

  return [value, setValue];
};