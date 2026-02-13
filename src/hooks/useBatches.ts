"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Batch, BatchMovement } from "@/types";
import { BatchInput, BatchUpdateInput } from "@/lib/validations/inventory";
import { safeToast } from "@/lib/error-handling";
import { useUser } from "@/hooks/useAuth";
import { createRepositories } from "@/lib/repositories";
import { isExpired as checkExpired, isExpiringSoon as checkExpiringSoon } from "@/lib/utils/date";
import { queryKeys } from "@/lib/queryKeys";

interface BatchWithTotal {
  batches: Batch[];
  totalRemaining: number;
}

const fetchBatchesByInventory = async (inventoryId: string): Promise<Batch[]> => {
  const { batches } = createRepositories(supabase);
  return batches.getBatchesByInventoryId(inventoryId);
};

const fetchBatchesWithTotal = async (inventoryId: string): Promise<BatchWithTotal> => {
  const { batches } = createRepositories(supabase);
  return batches.getBatchesByInventoryIdWithTotal(inventoryId);
};

const fetchExpiredBatches = async (pharmacyId: string): Promise<Batch[]> => {
  const { batches } = createRepositories(supabase);
  return batches.getExpiredBatches(pharmacyId);
};

const fetchBatchMovements = async (batchId: string): Promise<BatchMovement[]> => {
  const { batches } = createRepositories(supabase);
  return batches.getBatchMovements(batchId);
};

export const useBatches = (inventoryId?: string) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: batches = [],
    isLoading: loadingBatches,
    refetch: refetchBatches
  } = useQuery({
    queryKey: queryKeys.batches(inventoryId),
    queryFn: () => {
      if (!inventoryId) return [];
      return fetchBatchesByInventory(inventoryId);
    },
    enabled: !!inventoryId,
    staleTime: 30 * 1000,
  });

  const totalStock = batches.reduce((sum, b) => sum + b.remaining_qty, 0);

  const addBatchMutation = useMutation({
    mutationFn: async (batchData: BatchInput & { quantity: number }) => {
      if (!user) throw new Error("User not authenticated");
      if (!inventoryId) throw new Error("Inventory ID required");
      const { batches } = createRepositories(supabase);
      return batches.addBatch({
        inventory_id: inventoryId,
        pharmacy_id: user.id,
        batch_code: batchData.batch_code,
        manufacturing_date: batchData.manufacturing_date,
        expiry_date: batchData.expiry_date,
        quantity: batchData.quantity,
        created_by: user.id,
      });
    },
    onSuccess: () => {
      safeToast.success("Batch added successfully");
      queryClient.invalidateQueries({ queryKey: ['batches', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to add batch");
    }
  });

  const addStockToBatchMutation = useMutation({
    mutationFn: async ({ batchId, quantity }: { batchId: string; quantity: number }) => {
      const { batches } = createRepositories(supabase);
      return batches.addStockToBatch(batchId, quantity, user?.id);
    },
    onSuccess: () => {
      safeToast.success("Stock added to batch");
      queryClient.invalidateQueries({ queryKey: ['batches', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to add stock");
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ batchId, data }: { batchId: string; data: BatchUpdateInput }) => {
      const { batches } = createRepositories(supabase);
      return batches.updateBatch(batchId, data);
    },
    onSuccess: () => {
      safeToast.success("Batch updated successfully");
      queryClient.invalidateQueries({ queryKey: ['batches', inventoryId] });
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to update batch");
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { batches } = createRepositories(supabase);
      return batches.deleteBatch(batchId);
    },
    onSuccess: () => {
      safeToast.success("Batch deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['batches', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to delete batch");
    }
  });

  const addBatch = (data: Omit<BatchInput, 'quantity'> & { quantity: number }) => {
    addBatchMutation.mutate(data);
  };

  const addStockToBatch = (batchId: string, quantity: number) => {
    addStockToBatchMutation.mutate({ batchId, quantity });
  };

  const updateBatch = (batchId: string, data: BatchUpdateInput) => {
    updateBatchMutation.mutate({ batchId, data });
  };

  const deleteBatch = (batchId: string) => {
    deleteBatchMutation.mutate(batchId);
  };

  const isExpired = (expiryDate: string): boolean => checkExpired(expiryDate);

  const isExpiringSoon = (expiryDate: string, days: number = 30): boolean => 
    checkExpiringSoon(expiryDate, days);

  return {
    batches,
    totalStock,
    loadingBatches,
    refetchBatches,
    addBatch,
    addStockToBatch,
    updateBatch,
    deleteBatch,
    isExpired,
    isExpiringSoon,
    addBatchLoading: addBatchMutation.isPending,
    addStockLoading: addStockToBatchMutation.isPending,
    updateBatchLoading: updateBatchMutation.isPending,
    deleteBatchLoading: deleteBatchMutation.isPending,
  };
};

export const useExpiredBatches = (pharmacyId?: string) => {
  return useQuery({
    queryKey: queryKeys.expiredBatches(pharmacyId),
    queryFn: () => {
      if (!pharmacyId) return [];
      return fetchExpiredBatches(pharmacyId);
    },
    enabled: !!pharmacyId,
    staleTime: 60 * 1000,
  });
};

export const useBatchMovements = (batchId?: string) => {
  return useQuery({
    queryKey: queryKeys.batchMovements(batchId),
    queryFn: () => {
      if (!batchId) return [];
      return fetchBatchMovements(batchId);
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  });
};

export const useConsumeBatches = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inventoryId, 
      quantity, 
      orderId 
    }: { 
      inventoryId: string; 
      quantity: number; 
      orderId?: string;
    }) => {
      const { batches } = createRepositories(supabase);
      return batches.consumeBatches(inventoryId, quantity, orderId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches', variables.inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
