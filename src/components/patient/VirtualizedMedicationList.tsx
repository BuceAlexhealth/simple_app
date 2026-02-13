"use client";

import React, { useMemo } from "react";
import { InventoryItem } from "@/types";
import { MedicationCard } from "./MedicationCard";
import { Button } from "@/components/ui/Button";

interface VirtualizedMedicationListProps {
  items: InventoryItem[];
  maxVisible?: number;
}

export const VirtualizedMedicationList = React.memo<VirtualizedMedicationListProps>(({
  items,
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
        {visibleItems.map((item) => (
          <MedicationCard
            key={item.id}
            item={item}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-6">
          <Button onClick={loadMore} size="lg">
            Load More ({items.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
});

VirtualizedMedicationList.displayName = 'VirtualizedMedicationList';