import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ navItems, scrollToSection }) => {
  const contactPhone = "09 78 45 50 63";
  const telLink = `tel:${contactPhone.replace(/\s/g, '')}`;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <motion.button 
            onClick={() => scrollToSection('hero')}
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex items-center flex-shrink-0"
          >
            <Leaf className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <span className="ml-2 text-lg sm:text-xl font-bold gradient-text">AGRI-TH-117</span>
          </motion.button>
          
          <div className="flex items-center space-x-2 sm:space-x-6">
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => scrollToSection(item.sectionId)}
                  className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors font-medium"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            <Button asChild size="sm" className="font-semibold">
              <a href={telLink}>
                <Phone className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">{contactPhone}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;