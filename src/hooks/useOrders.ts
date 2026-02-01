"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus, InitiatorType, AcceptanceStatus } from "@/types";
import { handleAsyncError, safeToast } from "@/lib/error-handling";

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

    // Use a single query with proper joins to avoid N+1 problem
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          inventory:inventory_id (
            name
          )
        )
      `)
      .eq("pharmacy_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders:", error);
      safeToast.error("Failed to fetch orders");
      setLoading(false);
      return;
    }

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
    
    setLoading(false);
  }, [options.filter]);



  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error(`Failed to update order status to ${newStatus}:`, error);
      safeToast.error(`Failed to update order status: ${error.message}`);
      return;
    }

    await updateOrderChatMessage(orderId, newStatus);
    safeToast.success(`Order status updated to ${newStatus}`);
    await fetchOrders();
  };

  const updateOrderChatMessage = async (orderId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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

        const { error: updateError } = await supabase
          .from("messages")
          .update({ content: updatedContent })
          .eq("id", message.id);

        if (updateError) {
          console.error("Failed to update chat message:", updateError);
        }
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