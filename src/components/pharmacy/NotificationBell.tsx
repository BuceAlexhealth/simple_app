"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Clock, ChevronRight } from "lucide-react";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pendingCount, recentOrders, isLoading } = useOrderNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          isOpen
            ? "bg-[var(--surface-bg)] text-[var(--text-main)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-bg)]"
        )}
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm text-[var(--text-main)]">
              Orders
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {pendingCount > 0 ? `${pendingCount} new order${pendingCount > 1 ? "s" : ""}` : "No new orders"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                Loading...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                No new orders
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pharmacy/orders#order-${order.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block p-3 hover:bg-[var(--surface-bg)] transition-colors border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-main)] truncate">
                        New order from {order.patient_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-[var(--primary)]">
                          ₹{order.total_price.toFixed(2)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          • {formatTime(order.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {pendingCount > 0 && (
            <Link
              href="/pharmacy/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 p-3 border-t border-[var(--border)] text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-bg)] transition-colors"
            >
              View all new orders
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
