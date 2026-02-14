"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";

interface OrderNotification {
  id: string;
  patient_name: string;
  total_price: number;
  created_at: string;
  status: string;
}

export const useOrderNotifications = () => {
  const { user } = useUser();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orderNotifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return { pendingCount: 0, recentOrders: [] };

      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_price,
          created_at,
          status,
          patient:patient_id (
            full_name
          )
        `)
        .eq("pharmacy_id", user.id)
        .eq("status", "placed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const pendingCount = orders?.length || 0;
      const recentOrders: OrderNotification[] = (orders || []).map((order) => {
        const patient = (order as Record<string, unknown>).patient;
        const patientName = Array.isArray(patient) 
          ? patient[0]?.full_name 
          : (patient as { full_name?: string })?.full_name;
        
        return {
          id: order.id,
          patient_name: patientName || "Unknown",
          total_price: order.total_price,
          created_at: order.created_at,
          status: order.status,
        };
      });

      return { pendingCount, recentOrders };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  return {
    pendingCount: data?.pendingCount || 0,
    recentOrders: data?.recentOrders || [],
    isLoading,
    refetch,
  };
};
