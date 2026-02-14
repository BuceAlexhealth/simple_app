"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus, InitiatorType } from "@/types";
import { handleAsyncError, safeToast } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { useUser } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";

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
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface OrdersResponse {
  orders: Order[];
  orderItems: Record<string, OrderItem[]>;
}

interface FetchOrdersParams {
  userId: string;
  role: 'pharmacist' | 'patient';
  filter?: 'all' | 'patient' | 'pharmacy';
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

const fetchOrders = async (params: FetchOrdersParams): Promise<OrdersResponse> => {
  const { userId, role, filter, searchQuery, dateFrom, dateTo } = params;
  const { orders: ordersRepo } = createRepositories(supabase);

  let initiatorType: InitiatorType | undefined;
  if (filter === 'patient') initiatorType = 'patient';
  if (filter === 'pharmacy') initiatorType = 'pharmacy';

  const data = await handleAsyncError(
    () => ordersRepo.getOrdersByUserId(userId, role, {
      initiatorType,
      searchQuery: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    "Failed to fetch orders"
  );

  if (!data) {
    throw new Error("Failed to fetch orders");
  }

  interface OrderWithItems extends Order {
    order_items: OrderItem[];
  }

  const orderData = data as OrderWithItems[];

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
    queryKey: queryKeys.orders(user?.id, role, options.searchQuery, options.dateFrom, options.dateTo),
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchOrders({
        userId: user.id,
        role,
        filter: options.filter,
        searchQuery: options.searchQuery,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 30,
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
    onError: (error: Error) => {
      safeToast.error(error.message || "Failed to update order status");
    }
  });

  return {
    orders: data?.orders || [],
    orderItems: data?.orderItems || {},
    loading: isLoading,
    filteredOrders: data?.orders || [],
    updateStatus: updateStatusMutation.mutate,
    refetch
  };
};