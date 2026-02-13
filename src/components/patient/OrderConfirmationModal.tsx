"use client";

import React from "react";
import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CartItem } from "@/types";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  cart: CartItem[];
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
  isOrdering: boolean;
}

export const OrderConfirmationModal = React.memo<OrderConfirmationModalProps>(({
  isOpen,
  cart,
  total,
  onConfirm,
  onCancel,
  isOrdering
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">Confirm Order</h2>
                <p className="text-sm text-[var(--text-muted)]">Review your order before placing</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[var(--border-light)] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-light)]" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-[var(--surface-bg)] rounded-xl p-4">
              <h3 className="font-bold text-[var(--text-main)] mb-3">Order Summary</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-main)]">{item.name}</p>
                      <p className="text-[var(--text-light)]">
                        {item.profiles?.full_name || "Pharmacy"} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[var(--text-main)]">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-[var(--text-light)]">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] mt-3 pt-3 flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)]">Total</span>
                <span className="font-bold text-lg text-[var(--text-main)]">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-xl p-4">
              <h3 className="font-bold text-[var(--warning)] mb-2">Important Information</h3>
              <ul className="text-sm text-[var(--warning)] space-y-1">
                <li>• Once placed, the order cannot be cancelled from this app</li>
                <li>• Please contact the pharmacy directly for any changes</li>
                <li>• Payment will be processed at pickup/delivery</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isOrdering}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              isLoading={isOrdering}
              disabled={isOrdering}
              variant="default"
              className="flex-1"
            >
              {isOrdering ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OrderConfirmationModal.displayName = 'OrderConfirmationModal';