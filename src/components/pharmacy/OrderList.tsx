"use client";

import { useState, useEffect } from "react";
import { Loader, Clock } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "./OrderCard";


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
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
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
      {filteredOrders.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No orders at the moment.</p>
        </div>
      )}
    </div>
  );
}