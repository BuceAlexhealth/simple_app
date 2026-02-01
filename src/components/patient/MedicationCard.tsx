"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InventoryItem, CartItem } from "@/types";

interface MedicationCardProps {
  item: InventoryItem;
  cart: CartItem[];
  cartQuantity: number;
  onAddToCart: (item: InventoryItem) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  isOutOfStock: boolean;
}

export const MedicationCard = React.memo<MedicationCardProps>(({
  item,
  cart,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  isOutOfStock
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col">
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {item.profiles?.full_name || "Pharmacy"}
        </div>
        <span className="font-bold text-lg text-slate-900">₹{item.price}</span>
      </div>
      <h3 className="mb-1 truncate text-base font-bold text-slate-800" title={item.name}>
        {item.name}
      </h3>
      <div className="mt-auto pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${item.stock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {item.stock > 0 ? "In Stock" : "Out of Stock"}
          </span>
          <span className="text-xs text-slate-400 font-medium">{item.stock} units</span>
        </div>

        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1">
            <button
              className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors"
              onClick={() => onUpdateQuantity(item.id, -1)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-900">
              {cartQuantity}
            </span>
            <button
              className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors"
              onClick={() => onUpdateQuantity(item.id, 1)}
              disabled={isOutOfStock}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-10 transition-colors"
            disabled={item.stock <= 0}
            onClick={() => onAddToCart(item)}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
});

MedicationCard.displayName = 'MedicationCard';