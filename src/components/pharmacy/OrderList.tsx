"use client";

import { useState, useEffect } from "react";
import { Loader, Clock } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "./OrderCard";
import { motion, AnimatePresence } from "framer-motion";


interface OrderListProps {
  filter: 'all' | 'patient' | 'pharmacy';
}

export function OrderList({ filter }: OrderListProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { orderItems, loading, filteredOrders, updateStatus } = useOrders({ filter });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#order-')) {
      const orderId = hash.replace('#order-', '');
      setExpandedOrderId(orderId);
    }
  }, [setExpandedOrderId]);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedId = expandedOrderId === orderId ? null : orderId;
    setExpandedOrderId(newExpandedId);

    // Update URL hash without page reload
    if (newExpandedId) {
      window.history.pushState(null, '', `#order-${newExpandedId}`);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#order-')) {
        const orderId = hash.replace('#order-', '');
        setExpandedOrderId(orderId);
        // Scroll to the expanded order
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        setExpandedOrderId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-premium h-48 animate-pulse flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-[var(--border-light)] rounded"></div>
                <div className="h-8 w-32 bg-[var(--border-light)] rounded"></div>
              </div>
              <div className="h-12 w-24 bg-[var(--border-light)] rounded-xl"></div>
            </div>
            <div className="mt-auto h-10 w-full bg-[var(--border-light)] rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <AnimatePresence mode="popLayout">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const items = orderItems[order.id] || [];

          return (
            <OrderCard
              key={order.id}
              order={order}
              items={items}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleOrderExpansion(order.id)}
              onUpdateStatus={updateStatus}
            />
          );
        })}
      </AnimatePresence>

      {filteredOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 glass-card rounded-3xl border border-dashed border-[var(--border)]"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--surface-bg)] flex items-center justify-center text-[var(--text-light)] mx-auto mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-[var(--text-main)] mb-2">No active orders</h3>
          <p className="text-[var(--text-muted)] font-medium max-w-xs mx-auto">
            When customers place orders, they will appear here for you to process.
          </p>
        </motion.div>
      )}
    </div>
  );
}