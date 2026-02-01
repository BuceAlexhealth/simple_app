"use client";

import React, { useMemo } from "react";
import { InventoryItem, CartItem } from "@/types";
import { MedicationCard } from "./MedicationCard";

interface VirtualizedMedicationListProps {
  items: InventoryItem[];
  cart: CartItem[];
  onAddToCart: (item: InventoryItem) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  maxVisible?: number;
}

export const VirtualizedMedicationList = React.memo<VirtualizedMedicationListProps>(({
  items,
  cart,
  onAddToCart,
  onUpdateQuantity,
  maxVisible = 6
}) => {
  // For now, implement simple pagination instead of full virtualization
  // This is safer and easier to maintain
  const [visibleCount, setVisibleCount] = React.useState(maxVisible);
  
  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = items.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + maxVisible, items.length));
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => {
          const cartItem = cart.find(i => i.id === item.id);
          const cartQuantity = cartItem?.quantity || 0;
          const isOutOfStock = item.stock <= cartQuantity;

          return (
            <MedicationCard
              key={item.id}
              item={item}
              cart={cart}
              cartQuantity={cartQuantity}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              isOutOfStock={isOutOfStock}
            />
          );
        })}
      </div>
      
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Load More ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
});

VirtualizedMedicationList.displayName = 'VirtualizedMedicationList';