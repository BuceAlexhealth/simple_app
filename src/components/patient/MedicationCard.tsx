"use client";

import React from "react";
import { Plus, Minus, ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InventoryItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

interface MedicationCardProps {
  item: InventoryItem;
}

export const MedicationCard = React.memo<MedicationCardProps>(({ item }) => {
  const { addToCart, updateQuantity, getItemQuantity, isOutOfStock } = useCart();
  const cartQuantity = getItemQuantity(item.id);
  const outOfStock = isOutOfStock(item);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col group overflow-hidden border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 shadow-sm hover:shadow-xl bg-[var(--card-bg)]">
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <Badge variant="secondary" className="bg-[var(--primary-light)] text-primary border-none font-bold text-label-sm px-2 py-0.5 rounded-full">
              <Store className="w-3 h-3 mr-1" />
              {item.profiles?.full_name || "Pharmacy"}
            </Badge>
            <div className="text-price text-xl">
              ₹{item.price}
            </div>
          </div>

          <h3 className="heading-lg text-main mb-1 text-clamp-1 text-hover-primary transition-colors" title={item.name}>
            {item.name}
          </h3>

          {(item.brand_name || item.form) && (
            <p className="text-label mb-3 flex items-center gap-1">
              {item.brand_name && <span>{item.brand_name}</span>}
              {item.brand_name && item.form && <span className="text-[var(--primary)] opacity-50">•</span>}
              {item.form && <span>{item.form}</span>}
            </p>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                {item.stock > 0 ? (
                  <>
                    <div className="status-dot-success success-pulse"></div>
                    <span className="font-semibold text-success-dark">In Stock</span>
                  </>
                ) : (
                  <>
                    <div className="status-dot-error"></div>
                    <span className="font-semibold text-error">Out of Stock</span>
                  </>
                )}
              </div>
              <span className="text-[var(--text-muted)] font-medium bg-[var(--border-light)] px-2 py-0.5 rounded-md">
                {item.stock} units
              </span>
            </div>

            <div className="pt-2">
              <AnimatePresence mode="wait">
                {cartQuantity > 0 ? (
                  <motion.div
                    key="cart-controls"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="cart-controls"
                  >
                    <button
                      className="cart-button"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-5 w-5" />
                    </button>

                    <span className="text-lg font-black text-[var(--text-main)]">
                      {cartQuantity}
                    </span>

                    <button
                      className="cart-button"
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={outOfStock}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add-to-cart"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Button
                      variant={item.stock > 0 ? "gradient" : "outline"}
                      className="w-full h-12 rounded-xl font-black uppercase text-label-sm gap-2"
                      disabled={item.stock <= 0}
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

MedicationCard.displayName = 'MedicationCard';