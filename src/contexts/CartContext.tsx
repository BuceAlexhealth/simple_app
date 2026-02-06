"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { CartItem, InventoryItem } from '@/types';
import { notifications, format } from '@/lib/notifications';
import { INVENTORY_CONFIG } from '@/config/constants';

// Types
export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  pharmacyId: string | null;
}

export interface CartContextType extends CartState {
  // Actions
  addToCart: (item: InventoryItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  setPharmacy: (pharmacyId: string) => void;
  
  // Utilities
  getItemQuantity: (itemId: string) => number;
  isInCart: (itemId: string) => boolean;
  getSubtotal: () => number;
  isOutOfStock: (item: InventoryItem) => boolean;
}

// Action types
type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: InventoryItem; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; delta: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_PHARMACY'; payload: { pharmacyId: string } }
  | { type: 'LOAD_CART'; payload: { items: CartItem[]; pharmacyId: string | null } };

// Constants
const CART_STORAGE_KEY = 'patient_cart';
const CART_PHARMACY_KEY = 'cart_pharmacy_id';

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const newItems = [...state.items];
        const newQuantity = Math.min(
          newItems[existingItemIndex].quantity + quantity,
          item.stock // Don't exceed stock
        );
        
        if (newQuantity <= 0) {
          newItems.splice(existingItemIndex, 1);
        } else {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQuantity,
          };
        }
        
        return {
          ...state,
          items: newItems,
        };
      } else {
        // Add new item
        if (quantity > 0) {
          return {
            ...state,
            items: [...state.items, { ...item, quantity }],
          };
        }
        return state;
      }
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.itemId),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, delta } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) return state;
      
      const newItems = [...state.items];
      const item = newItems[itemIndex];
      const newQuantity = item.quantity + delta;
      
      if (newQuantity <= 0) {
        // Remove item if quantity would be 0 or less
        newItems.splice(itemIndex, 1);
      } else {
        // Update quantity (don't exceed stock)
        const maxQuantity = item.stock || INVENTORY_CONFIG.LOW_STOCK_THRESHOLD;
        newItems[itemIndex] = {
          ...item,
          quantity: Math.min(newQuantity, maxQuantity),
        };
      }
      
      return {
        ...state,
        items: newItems,
      };
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
      };
    }

    case 'SET_PHARMACY': {
      return {
        ...state,
        pharmacyId: action.payload.pharmacyId,
      };
    }

    case 'LOAD_CART': {
      return {
        ...state,
        items: action.payload.items,
        pharmacyId: action.payload.pharmacyId,
      };
    }

    default:
      return state;
  }
}

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  pharmacyId: null,
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
interface CartProviderProps {
  children: ReactNode;
  initialPharmacyId?: string;
}

export function CartProvider({ children, initialPharmacyId }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      if (state.items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      
      if (state.pharmacyId) {
        localStorage.setItem(CART_PHARMACY_KEY, state.pharmacyId);
      }
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [state.items, state.pharmacyId]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedPharmacyId = localStorage.getItem(CART_PHARMACY_KEY);
      
      const cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
      
      dispatch({
        type: 'LOAD_CART',
        payload: {
          items: cartItems,
          pharmacyId: savedPharmacyId || initialPharmacyId || null,
        },
      });
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, [initialPharmacyId]);

  // Calculate derived values
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Actions
  const addToCart = useCallback((item: InventoryItem, quantity: number = 1) => {
    if (item.stock <= 0) {
      notifications.business.insufficientStock();
      return;
    }

    const existingQuantity = state.items.find(cartItem => cartItem.id === item.id)?.quantity || 0;
    const totalQuantity = existingQuantity + quantity;

    if (totalQuantity > item.stock) {
      notifications.warning(`Only ${item.stock} units available in stock`);
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: { item, quantity },
    });

    if (existingQuantity === 0) {
      notifications.cart.updated();
    }
  }, [state.items]);

  const removeFromCart = useCallback((itemId: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { itemId },
    });
    notifications.cart.updated();
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { itemId, delta },
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    notifications.cart.updated();
  }, []);

  const setPharmacy = useCallback((pharmacyId: string) => {
    dispatch({
      type: 'SET_PHARMACY',
      payload: { pharmacyId },
    });
  }, []);

  // Utility functions
  const getItemQuantity = useCallback((itemId: string): number => {
    const item = state.items.find(cartItem => cartItem.id === itemId);
    return item?.quantity || 0;
  }, [state.items]);

  const isInCart = useCallback((itemId: string): boolean => {
    return state.items.some(item => item.id === itemId);
  }, [state.items]);

  const getSubtotal = useCallback((): number => {
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [state.items]);

  const isOutOfStock = useCallback((item: InventoryItem): boolean => {
    const cartQuantity = getItemQuantity(item.id);
    return item.stock <= cartQuantity;
  }, [getItemQuantity]);

  const value: CartContextType = {
    // State
    items: state.items,
    totalItems,
    totalPrice,
    pharmacyId: state.pharmacyId,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setPharmacy,
    
    // Utilities
    getItemQuantity,
    isInCart,
    getSubtotal,
    isOutOfStock,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Hook for cart validation and business logic
export function useCartValidation() {
  const { items, pharmacyId } = useCart();

  const isValid = items.length > 0 && !!pharmacyId;
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const hasLowStock = items.some(item => {
    const stockLevel = item.stock - item.quantity;
    return stockLevel <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD;
  });

  const hasCriticalStock = items.some(item => {
    const stockLevel = item.stock - item.quantity;
    return stockLevel <= INVENTORY_CONFIG.CRITICAL_STOCK_THRESHOLD;
  });

  return {
    isValid,
    itemCount,
    totalQuantity,
    hasLowStock,
    hasCriticalStock,
    canCheckout: isValid && !hasCriticalStock,
  };
}

// Hook for cart persistence and synchronization
export function useCartSync(userId?: string) {
  const { items, pharmacyId } = useCart();

  // Sync with backend if user is logged in
  useEffect(() => {
    if (userId && items.length > 0 && pharmacyId) {
      // Here you could implement backend sync logic
      console.log('Would sync cart with backend for user:', userId);
    }
  }, [userId, items, pharmacyId]);
}

// Utility to clear cart when switching pharmacies
export function usePharmacySwitch() {
  const { items, clearCart, setPharmacy } = useCart();

  const switchPharmacy = useCallback((newPharmacyId: string) => {
    if (items.length > 0) {
      // Would typically show confirmation dialog
      const confirmed = window.confirm(
        'Switching pharmacies will clear your current cart. Continue?'
      );
      if (confirmed) {
        clearCart();
        setPharmacy(newPharmacyId);
      }
    } else {
      setPharmacy(newPharmacyId);
    }
  }, [items.length, clearCart, setPharmacy]);

  return switchPharmacy;
}