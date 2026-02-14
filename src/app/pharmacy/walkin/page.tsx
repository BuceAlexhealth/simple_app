"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingCart, User, X, Plus, Minus, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem extends InventoryItem {
  cartQty: number;
}

export default function WalkinSalesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const router = useRouter();

  const fetchInventory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { inventory } = createRepositories(supabase);
    const data = await handleAsyncError(
      () => inventory.getInventoryByPharmacyId(user.id),
      "Failed to load inventory"
    );

    if (data) {
      setInventory((data as InventoryItem[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = useMemo(() =>
    inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(item => item.stock > 0),
    [inventory, searchQuery]
  );

  const addToCart = useCallback((item: InventoryItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      if (existingItem.cartQty >= item.stock) {
        toast.error("Not enough stock available");
        return;
      }
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, cartQty: cartItem.cartQty + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, cartQty: 1 }]);
    }
  }, [cart]);

  const updateCartQty = useCallback((itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = item.cartQty + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          toast.error("Not enough stock available");
          return item;
        }
        return { ...item, cartQty: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  }, [cart]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  }, [cart]);

  const cartTotal = useMemo(() =>
    cart.reduce((total, item) => total + (item.price * item.cartQty), 0),
    [cart]
  );

  const cartItemCount = useMemo(() =>
    cart.reduce((count, item) => count + item.cartQty, 0),
    [cart]
  );

  const submitWalkinOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Please add items to the cart");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { orders } = createRepositories(supabase);

      const orderItems = cart.map(item => ({
        inventory_id: item.id,
        quantity: item.cartQty,
        price: item.price
      }));

      const result = await orders.createWalkinOrder({
        pharmacy_id: user.id,
        items: orderItems,
        total_price: cartTotal,
        walkin_name: walkinName || undefined,
        walkin_phone: walkinPhone || undefined,
        notes: notes || undefined
      });

      setLastInvoice(result.invoice.invoice_number);
      setShowSuccess(true);
      setCart([]);
      setWalkinName("");
      setWalkinPhone("");
      setNotes("");
      setSearchQuery("");

      setTimeout(() => {
        setShowSuccess(false);
        setLastInvoice(null);
      }, 3000);

    } catch (error) {
      console.error("Walk-in order error:", error);
      toast.error("Failed to complete sale");
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, cartTotal, walkinName, walkinPhone, notes]);

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Sale Complete!</h2>
          {lastInvoice && (
            <p className="text-[var(--text-muted)]">Invoice: {lastInvoice}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Inventory */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Walk-in Sale</h1>
              <p className="text-sm text-[var(--text-muted)]">Quick POS for over-the-counter sales</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Inventory Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {filteredInventory.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(item)}
                  className="text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-bg)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-main)] text-sm truncate">
                        {item.name}
                      </p>
                      {item.brand_name && (
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {item.brand_name}
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Stock: {item.stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[var(--primary)]">
                        ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {filteredInventory.length === 0 && !loading && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p>No medicines found</p>
            </div>
          )}
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full lg:w-96 space-y-4">
          <Card className="sticky top-4">
            <CardContent className="p-4 space-y-4">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[var(--primary)]" />
                  <span className="font-semibold text-[var(--text-main)]">Cart</span>
                  {cartItemCount > 0 && (
                    <span className="bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-[var(--text-muted)] text-sm">
                    Add items to cart
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-main)] truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-hover)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.cartQty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-hover)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="w-16 text-right">
                        <p className="text-sm font-medium text-[var(--text-main)]">
                          ₹{(item.price * item.cartQty).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Info */}
              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
                  <User className="w-4 h-4" />
                  <span>Customer Details (Optional)</span>
                </div>
                <Input
                  placeholder="Customer Name"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                />
                <Input
                  placeholder="Phone Number"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  type="tel"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-[var(--text-main)]">Total</span>
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={submitWalkinOrder}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Complete Sale</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
