import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const BannerContext = createContext();

export const useBanner = () => useContext(BannerContext);

export const BannerProvider = ({ children }) => {
  const [isBannerClosed, setIsBannerClosed] = useLocalStorage('bannerClosed', false);
  const [isBannerVisible, setIsBannerVisible] = useState(!isBannerClosed);

  // This effect synchronizes the local state with the localStorage-backed state.
  useEffect(() => {
    setIsBannerVisible(!isBannerClosed);
  }, [isBannerClosed]);

  const closeBanner = () => {
    setIsBannerClosed(true);
  };

  return (
    <BannerContext.Provider value={{ isBannerVisible, closeBanner }}>
      {children}
    </BannerContext.Provider>
  );
};