"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/types";
import { safeToast } from "@/lib/error-handling";
import { useUser } from "@/contexts/UserContext";

interface InventoryResponse {
  items: InventoryItem[];
}

const fetchInventory = async (userId: string): Promise<InventoryResponse> => {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("pharmacy_id", userId)
    .order("name");

  if (error) {
    console.error("Error fetching inventory:", error);
    throw new Error("Failed to load inventory");
  }

  return {
    items: (data as InventoryItem[]) || []
  };
};

export const useInventory = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchInventory(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - inventory changes frequently
  });

  const recordOfflineSalesMutation = useMutation({
    mutationFn: async ({ adjustments, items }: { adjustments: Record<string, number>, items: InventoryItem[] }) => {
      const updatePromises = Object.entries(adjustments)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = items.find(i => i.id === id);
          if (!item) return Promise.resolve();

          return supabase
            .from("inventory")
            .update({ stock: Math.max(0, item.stock - qty) })
            .eq("id", id);
        });

      await Promise.all(updatePromises);
      return true;
    },
    onSuccess: () => {
      safeToast.success("EOD adjustments applied successfully!");
      // Invalidate and refetch inventory
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
      setAdjustments({}); // Clear adjustments
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to apply EOD adjustments");
    }
  });

  // This function now just stores adjustments locally
  const updateAdjustment = (itemId: string, quantity: number) => {
    setAdjustments(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const hasAdjustments = Object.values(adjustments).some(v => v > 0);

  const recordOfflineSales = () => {
    if (data?.items) {
      recordOfflineSalesMutation.mutate({ adjustments, items: data.items });
    }
  };

  return {
    items: data?.items || [],
    loading: isLoading,
    adjustments,
    hasAdjustments,
    recordOfflineSales,
    updateAdjustment,
    refetch
  };
};

// Fix the missing import
import { useState } from "react";