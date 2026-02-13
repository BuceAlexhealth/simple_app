"use client";

import { useState, useEffect } from "react";
import { Loader2, ClipboardList } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "./OrderCard";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedOrderId(orderId);
    }
  }, []);

  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedId = expandedOrderId === orderId ? null : orderId;
    setExpandedOrderId(newExpandedId);

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

  // Only show loading if we have no data yet
  if (loading && filteredOrders.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-[var(--border)] rounded" />
                  <div className="h-6 w-32 bg-[var(--border)] rounded" />
                </div>
                <div className="h-10 w-24 bg-[var(--border)] rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
            No active orders
          </h3>
          <p className="text-[var(--text-muted)] max-w-sm">
            When customers place orders, they will appear here for you to process.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            items={orderItems[order.id] || []}
            isExpanded={expandedOrderId === order.id}
            onToggleExpand={() => toggleOrderExpansion(order.id)}
            onUpdateStatus={(orderId, newStatus) => updateStatus({ orderId, newStatus })}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
