import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Helper to determine usage from category
const getUsageFromCategory = (category) => {
  if (!category) return null;
  const cat = category.toLowerCase();
  if (cat.includes('industri') || cat.includes('highbay') || cat.includes('atelier')) {
    return 'industriel';
  }
  if (cat.includes('tertiaire') || cat.includes('bureau') || cat.includes('reglette')) {
    return 'tertiaire';
  }
  if (cat.includes('agricol') || cat.includes('serre') || cat.includes('elevage')) {
    return 'agricole';
  }
  return null;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('effinor-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        logger.log('🛒 Cart loaded from localStorage:', parsedCart.length, 'items');
      }
    } catch (error) {
      logger.error("Could not parse cart from localStorage", error);
      setCart([]);
      localStorage.removeItem('effinor-cart'); // Clear corrupted data
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length >= 0) { // Only save if cart has been initialized
      try {
        localStorage.setItem('effinor-cart', JSON.stringify(cart));
        logger.log('💾 Cart saved to localStorage:', cart.length, 'items');
      } catch (error) {
        logger.error("Could not save cart to localStorage", error);
      }
    }
  }, [cart]);

  const saveCart = (newCart) => {
    setCart(newCart);
    // localStorage sync is handled by useEffect above
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    // Normalize product data for cart storage
    const normalizedProduct = {
      id: product.id,
      nom: product.nom,
      reference: product.reference || null,
      marque: product.marque || null,
      prix: product.prix || null,
      sur_devis: product.sur_devis || false,
      image_url: product.image_url || product.image_1 || null,
      slug: product.slug || null,
      categorie: product.categorie || null,
      // Usage is derived from category - store it for reference
      usage: product.usage || getUsageFromCategory(product.categorie),
      quantity: quantity
    };
    
    if (existingItem) {
      const newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      saveCart(newCart);
    } else {
      saveCart([...cart, normalizedProduct]);
    }
  };

  const removeFromCart = (productId) => {
    saveCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    // Nettoyer le localStorage directement pour éviter tout problème de timing
    try {
      localStorage.removeItem('effinor-cart');
      logger.log('🛒 Cart cleared from localStorage');
    } catch (error) {
      logger.error("Could not clear cart from localStorage", error);
    }
    // Mettre à jour le state
    saveCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      // Handle prix field (not price) and sur_devis flag
      if (item.sur_devis || !item.prix || item.prix === 0) {
        return total; // Skip items without price or on quote
      }
      const price = parseFloat(item.prix) || 0;
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};