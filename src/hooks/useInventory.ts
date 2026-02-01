"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/types";
import { safeToast } from "@/lib/error-handling";

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const fetchInventory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("pharmacy_id", user.id)
      .order("name");

    if (error) {
      console.error("Error fetching inventory:", error);
      safeToast.error("Failed to load inventory");
    } else {
      setItems((data as InventoryItem[]) || []);
    }
    setLoading(false);
  }, []);

  const recordOfflineSales = async () => {
    const promises = Object.entries(adjustments).map(async ([id, qty]) => {
      if (qty <= 0) return;
      const item = items.find(i => i.id === id);
      if (!item) return;

      return supabase
        .from("inventory")
        .update({ stock: Math.max(0, item.stock - qty) })
        .eq("id", id);
    });

    await Promise.all(promises);
    setAdjustments({});
    await fetchInventory();
    safeToast.success("EOD adjustments applied successfully!");
  };

  const updateAdjustment = (itemId: string, quantity: number) => {
    setAdjustments(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const hasAdjustments = Object.values(adjustments).some(v => v > 0);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    items,
    loading,
    adjustments,
    hasAdjustments,
    recordOfflineSales,
    updateAdjustment,
    refetch: fetchInventory
  };
};