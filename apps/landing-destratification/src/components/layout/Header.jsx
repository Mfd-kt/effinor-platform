import React from 'react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const scrollToForm = () => {
    document.getElementById('form-container')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-20">
          <span className="text-xl md:text-2xl font-bold text-primary">Effinor</span>
          <Button onClick={scrollToForm} className="btn-primary hidden md:inline-flex bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg">
            👉 Recevoir mon étude gratuite en 24h
          </Button>
        </div>
      </div>
    </header>
  );
};
export default Header;