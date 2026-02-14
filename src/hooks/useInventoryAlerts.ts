"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createRepositories } from "@/lib/repositories";
import { queryKeys } from "@/lib/queryKeys";

interface LowStockItem {
    id: string;
    name: string;
    brand_name?: string;
    form?: string;
    price: number;
    stock: number;
}

interface ExpiringBatch {
    id: string;
    batch_code: string;
    expiry_date: string;
    remaining_qty: number;
    inventory: {
        id: string;
        name: string;
        brand_name?: string;
    };
}

const fetchLowStockItems = async (pharmacyId: string, threshold: number = 10): Promise<LowStockItem[]> => {
    const { inventory } = createRepositories(supabase);
    return inventory.getLowStockItems(pharmacyId, threshold);
};

const fetchCriticalStockItems = async (pharmacyId: string): Promise<LowStockItem[]> => {
    const { inventory } = createRepositories(supabase);
    return inventory.getCriticalStockItems(pharmacyId, 3);
};

const fetchOutOfStockItems = async (pharmacyId: string): Promise<LowStockItem[]> => {
    const { inventory } = createRepositories(supabase);
    return inventory.getOutOfStockItems(pharmacyId);
};

const fetchExpiringBatches = async (pharmacyId: string, daysAhead: number = 30): Promise<ExpiringBatch[]> => {
    const { inventory } = createRepositories(supabase);
    return inventory.getExpiringBatches(pharmacyId, daysAhead);
};

export const useLowStockItems = (pharmacyId?: string, threshold: number = 10) => {
    return useQuery({
        queryKey: queryKeys.lowStockItems(pharmacyId),
        queryFn: () => {
            if (!pharmacyId) return [];
            return fetchLowStockItems(pharmacyId, threshold);
        },
        enabled: !!pharmacyId,
        staleTime: 60 * 1000,
    });
};

export const useCriticalStockItems = (pharmacyId?: string) => {
    return useQuery({
        queryKey: queryKeys.criticalStockItems(pharmacyId),
        queryFn: () => {
            if (!pharmacyId) return [];
            return fetchCriticalStockItems(pharmacyId);
        },
        enabled: !!pharmacyId,
        staleTime: 60 * 1000,
    });
};

export const useOutOfStockItems = (pharmacyId?: string) => {
    return useQuery({
        queryKey: queryKeys.outOfStockItems(pharmacyId),
        queryFn: () => {
            if (!pharmacyId) return [];
            return fetchOutOfStockItems(pharmacyId);
        },
        enabled: !!pharmacyId,
        staleTime: 60 * 1000,
    });
};

export const useExpiringBatches = (pharmacyId?: string, daysAhead: number = 30) => {
    return useQuery({
        queryKey: queryKeys.expiringBatches(pharmacyId),
        queryFn: () => {
            if (!pharmacyId) return [];
            return fetchExpiringBatches(pharmacyId, daysAhead);
        },
        enabled: !!pharmacyId,
        staleTime: 60 * 1000,
    });
};

export const useInventoryAlerts = (pharmacyId?: string) => {
    const lowStock = useLowStockItems(pharmacyId, 10);
    const criticalStock = useCriticalStockItems(pharmacyId);
    const outOfStock = useOutOfStockItems(pharmacyId);
    const expiringBatches = useExpiringBatches(pharmacyId, 30);

    const totalAlerts = 
        (lowStock.data?.length || 0) + 
        (criticalStock.data?.length || 0) + 
        (outOfStock.data?.length || 0) + 
        (expiringBatches.data?.length || 0);

    const hasAlerts = totalAlerts > 0;

    return {
        lowStock,
        criticalStock,
        outOfStock,
        expiringBatches,
        totalAlerts,
        hasAlerts,
        isLoading: lowStock.isLoading || criticalStock.isLoading || outOfStock.isLoading || expiringBatches.isLoading,
    };
};
