"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus } from "@/types";
import { handleAsyncError, safeToast } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";

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
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { orders: ordersRepo } = createRepositories(supabase);

    const data = await handleAsyncError(
      () => ordersRepo.getOrdersByUserId(user.id, 'pharmacist'),
      "Failed to fetch orders"
    );

    if (data) {
      const orderData = data as any[];
      setOrders(orderData);

      // Extract order items from the nested query result
      const itemsByOrder = orderData.reduce((acc, order) => {
        if (order.order_items && order.order_items.length > 0) {
          acc[order.id] = order.order_items;
        }
        return acc;
      }, {} as Record<string, OrderItem[]>);
      setOrderItems(itemsByOrder);
    }

    setLoading(false);
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { orders: ordersRepo } = createRepositories(supabase);

    const success = await handleAsyncError(
      () => ordersRepo.updateOrderStatus(orderId, newStatus),
      `Failed to update order status to ${newStatus}`
    );

    if (success) {
      await updateOrderChatMessage(orderId, newStatus);
      safeToast.success(`Order status updated to ${newStatus}`);
      await fetchOrders();
    }
  };

  const updateOrderChatMessage = async (orderId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
        .eq("receiver_id", user.id)
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

  const filteredOrders = orders.filter(order => {
    if (options.filter === 'all') return true;
    if (options.filter === 'patient') return order.initiator_type !== 'pharmacy';
    if (options.filter === 'pharmacy') return order.initiator_type === 'pharmacy';
    return true;
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, options.filter]);

  return {
    orders,
    orderItems,
    loading,
    filteredOrders,
    updateStatus,
    refetch: fetchOrders
  };
};