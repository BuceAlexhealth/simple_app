"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus } from "@/types";
import { handleAsyncError, safeToast } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { useUser } from "@/contexts/UserContext";

interface OrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  quantity: number;
  price_at_time: number;
  inventory?: {
    name: string;
  };
}

export interface UseOrdersOptions {
  filter?: 'all' | 'patient' | 'pharmacy';
  role?: 'pharmacist' | 'patient';
}

interface OrdersResponse {
  orders: Order[];
  orderItems: Record<string, OrderItem[]>;
}

const fetchOrders = async (userId: string, role: 'pharmacist' | 'patient' = 'pharmacist'): Promise<OrdersResponse> => {
  const { orders: ordersRepo } = createRepositories(supabase);

  const data = await handleAsyncError(
    () => ordersRepo.getOrdersByUserId(userId, role),
    "Failed to fetch orders"
  );

  if (!data) {
    throw new Error("Failed to fetch orders");
  }

  const orderData = data as any[];

  // Extract order items from the nested query result
  const orderItems = orderData.reduce((acc, order) => {
    if (order.order_items && order.order_items.length > 0) {
      acc[order.id] = order.order_items;
    }
    return acc;
  }, {} as Record<string, OrderItem[]>);

  return {
    orders: orderData,
    orderItems
  };
};

const updateOrderChatMessage = async (orderId: string, status: string, userId: string) => {
  if (!userId) return;

  const { messages: messagesRepo } = createRepositories(supabase);

  // Find the order-related message and update its content with new status
  const { data: order } = await supabase
    .from("orders")
    .select("patient_id")
    .eq("id", orderId)
    .single();

  if (order?.patient_id) {
    // Find the message containing this order ID
    const { data: message } = await supabase
      .from("messages")
      .select("id, content")
      .eq("sender_id", order.patient_id)
      .eq("receiver_id", userId)
      .like("content", `%ORDER_ID:${orderId}%`)
      .single();

    if (message?.content) {
      // Update the ORDER_STATUS line in the message content
      const updatedContent = message.content.replace(
        /ORDER_STATUS:[^\n]+/,
        `ORDER_STATUS:${status}`
      );

      await handleAsyncError(
        () => messagesRepo.updateMessage(message.id, updatedContent),
        "Failed to update chat message"
      );
    }
  }
};

export const useOrders = (options: UseOrdersOptions = {}) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const role = options.role || 'pharmacist';

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', user?.id, role],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchOrders(user.id, role);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 30, // Poll every 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { orders: ordersRepo } = createRepositories(supabase);

      const success = await handleAsyncError(
        () => ordersRepo.updateOrderStatus(orderId, newStatus),
        `Failed to update order status to ${newStatus}`
      );

      if (!success) {
        throw new Error("Failed to update order status");
      }

      return { orderId, newStatus };
    },
    onSuccess: async ({ orderId, newStatus }) => {
      await updateOrderChatMessage(orderId, newStatus, user?.id || '');
      safeToast.success(`Order status updated to ${newStatus}`);

      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
    onError: (error: any) => {
      safeToast.error(error.message || "Failed to update order status");
    }
  });

  const filteredOrders = data?.orders?.filter(order => {
    if (options.filter === 'all') return true;
    if (options.filter === 'patient') return order.initiator_type !== 'pharmacy';
    if (options.filter === 'pharmacy') return order.initiator_type === 'pharmacy';
    return true;
  }) || [];

  return {
    orders: data?.orders || [],
    orderItems: data?.orderItems || {},
    loading: isLoading,
    filteredOrders,
    updateStatus: updateStatusMutation.mutate,
    refetch
  };
};