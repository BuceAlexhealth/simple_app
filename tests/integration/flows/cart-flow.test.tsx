import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { InventoryItem } from '@/types';

const mockInventoryItem: InventoryItem = {
  id: 'item-1',
  name: 'Paracetamol',
  price: 50,
  stock: 100,
  pharmacy_id: 'pharmacy-1',
  brand_name: 'Crocin',
  form: 'Tablet',
};

const mockInventoryItem2: InventoryItem = {
  id: 'item-2',
  name: 'Amoxicillin',
  price: 120,
  stock: 50,
  pharmacy_id: 'pharmacy-1',
  brand_name: 'Novamox',
  form: 'Capsule',
};

const mockOutOfStockItem: InventoryItem = {
  id: 'item-3',
  name: 'Otrivin',
  price: 30,
  stock: 0,
  pharmacy_id: 'pharmacy-1',
};

describe('Cart Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Adding items to cart', () => {
    it('adds item to empty cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalPrice).toBe(50);
    });

    it('increases quantity when adding existing item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
        result.current.addToCart(mockInventoryItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalPrice).toBe(100);
    });

    it('sets pharmacy when first item is added', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
      });

      expect(result.current.pharmacyId).toBe('pharmacy-1');
    });

    it('does not add out of stock item', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockOutOfStockItem);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('shows warning when adding more than stock', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 150);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Removing items from cart', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
        result.current.removeFromCart('item-1');
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Updating quantity', () => {
    it('increases quantity with positive delta', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
        result.current.updateQuantity('item-1', 2);
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('decreases quantity with negative delta', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 3);
        result.current.updateQuantity('item-1', -1);
      });

      expect(result.current.items[0].quantity).toBe(2);
    });

    it('removes item when quantity goes to zero', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
        result.current.updateQuantity('item-1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Cart totals', () => {
    it('calculates total price correctly', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 2);
        result.current.addToCart(mockInventoryItem2, 1);
      });

      expect(result.current.totalPrice).toBe(220);
    });

    it('calculates total items correctly', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 3);
        result.current.addToCart(mockInventoryItem2, 2);
      });

      expect(result.current.totalItems).toBe(5);
    });
  });

  describe('Cart utilities', () => {
    it('isInCart returns correct value', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
      });

      expect(result.current.isInCart('item-1')).toBe(true);
      expect(result.current.isInCart('item-nonexistent')).toBe(false);
    });

    it('getItemQuantity returns correct value', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 5);
      });

      expect(result.current.getItemQuantity('item-1')).toBe(5);
      expect(result.current.getItemQuantity('item-nonexistent')).toBe(0);
    });

    it('getSubtotal returns correct value', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 3);
      });

      expect(result.current.getSubtotal()).toBe(150);
    });

    it('isOutOfStock returns correct value', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem, 100);
      });

      expect(result.current.isOutOfStock(mockInventoryItem)).toBe(true);
      expect(result.current.isOutOfStock(mockOutOfStockItem)).toBe(true);
    });
  });

  describe('Clear cart', () => {
    it('clears all items', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addToCart(mockInventoryItem);
        result.current.addToCart(mockInventoryItem2);
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('Set pharmacy', () => {
    it('sets pharmacy id', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.setPharmacy('new-pharmacy');
      });

      expect(result.current.pharmacyId).toBe('new-pharmacy');
    });
  });
});
