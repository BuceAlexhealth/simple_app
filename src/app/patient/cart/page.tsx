"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    ChevronLeft,
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    ArrowRight,
    CreditCard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { storage } from "@/lib/utils-performance";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createRepositories } from "@/lib/repositories";
import { handleAsyncError } from "@/lib/error-handling";

export default function PatientCartPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = storage.get('patient_cart');
        if (savedCart) {
            setCart(savedCart);
        }
        setLoading(false);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            storage.set('patient_cart', cart);
        } else {
            storage.remove('patient_cart');
        }
    }, [cart]);

    const removeFromCart = useCallback((itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
        toast.info("Item removed from cart");
    }, []);

    const updateQuantity = useCallback((itemId: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId);
            if (!item) return prev;

            const newQuantity = Math.max(1, item.quantity + delta);
            // Check stock limit if possible (item.stock)
            if (delta > 0 && item.stock <= item.quantity) {
                toast.error(`Only ${item.stock} items available in stock`);
                return prev;
            }
            return prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
        });
    }, []);

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        [cart]);

    const total = subtotal;

    const sendOrderNotificationToPharmacy = async (order: any, patientId: string, pharmacyId: string) => {
        const { messages: messagesRepo } = createRepositories(supabase);

        const orderItemsSummary = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
        const orderSummary = `New Order via Cart #${order.id.slice(0, 8)}:\n${orderItemsSummary}\nTotal: ₹${order.total_price.toFixed(2)}`;

        const messageContent = orderSummary + `\n\nORDER_ID:${order.id}\nORDER_STATUS:${order.status}\nORDER_TOTAL:${order.total_price}`;

        await handleAsyncError(
            () => messagesRepo.sendMessage({
                sender_id: patientId,
                receiver_id: pharmacyId,
                content: messageContent,
                order_id: order.id
            }),
            "Order placed, but failed to notify pharmacy chat"
        );
    };

    const confirmOrder = async () => {
        if (cart.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in to place an order");
            router.push("/");
            return;
        }

        setIsOrdering(true);
        const pharmacyId = cart[0].pharmacy_id;

        const { orders: ordersRepo } = createRepositories(supabase);

        const order = await handleAsyncError(
            () => ordersRepo.createOrder({
                patient_id: user.id,
                pharmacy_id: pharmacyId,
                total_price: total,
                status: 'placed'
            }),
            "Failed to place order"
        );

        if (order) {
            const orderItemsInsert = cart.map(item => ({
                order_id: order.id,
                inventory_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsInsert);

            if (itemsError) {
                handleAsyncError(() => Promise.reject(itemsError), "Failed to save order items");
            } else {
                await sendOrderNotificationToPharmacy(order, user.id, pharmacyId);
                setCart([]);
                toast.success("Order placed successfully!", {
                    description: "Your pharmacist has been notified.",
                    duration: 5000,
                });
                router.push("/patient/orders");
            }
        }
        setIsOrdering(false);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
            <div className="spinner-premium"></div>
        </div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 fade-in">
                <div className="flex items-center gap-4">
                    <Link href="/patient">
                        <button className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[var(--text-main)] border border-slate-100 dark:border-slate-700">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] mb-0 tracking-tight">My <span className="text-[var(--primary)]">Cart</span></h1>
                        <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">{cart.length} items in your basket</p>
                    </div>
                </div>
            </header>

            {cart.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 md:p-16 rounded-3xl flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto shadow-2xl mt-12"
                >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] float-animation">
                        <ShoppingBag className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)]">Your cart is empty</h2>
                        <p className="text-sm text-[var(--text-muted)]">Browse your local pharmacies to find what you need.</p>
                    </div>
                    <Link href="/patient">
                        <Button variant="default" className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg glow-primary">
                            Explore Medications
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    {/* Cart Items List */}
                    <div className="flex-1 space-y-4 w-full min-w-0">
                        <AnimatePresence mode="popLayout">
                            {cart.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card p-4 md:p-6 rounded-[2rem] group hover:border-[var(--primary)] transition-all duration-300 relative overflow-hidden shadow-sm"
                                >
                                    <div className="flex gap-4 md:gap-8 items-start">
                                        {/* Item Image */}
                                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center flex-shrink-0 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                            <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <h3 className="text-lg md:text-xl font-black text-[var(--text-main)] truncate mb-0.5 group-hover:text-[var(--primary)] transition-colors leading-tight">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                                        {item.brand_name || "Generic"}
                                                        <span className="w-1 h-1 rounded-full bg-[var(--primary)] opacity-50"></span>
                                                        <span className="opacity-70">#{item.id.slice(0, 4)}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-slate-400 hover:text-rose-500 transition-all p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl border border-slate-100 dark:border-slate-700 flex-shrink-0 active:scale-90"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex flex-row items-end justify-between gap-4 mt-4">
                                                {/* Price */}
                                                <div className="space-y-1">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[var(--primary)] font-black text-xs md:text-sm">₹</span>
                                                        <span className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tighter leading-none">{item.price}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-80">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                                                            {item.stock} in stock
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-[var(--primary)] hover:text-white text-slate-500 transition-all active:scale-90"
                                                    >
                                                        <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                    <span className="w-8 md:w-10 text-center font-black text-base md:text-lg text-[var(--text-main)]">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-[var(--primary)] hover:text-white text-slate-500 transition-all active:scale-90"
                                                    >
                                                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Checkout Card */}
                    <aside className="w-full xl:w-[380px] shrink-0 sticky top-8 slide-up">
                        <div className="glass-card p-6 md:p-8 rounded-[2rem] shadow-2xl border-[var(--primary)] border-opacity-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-[0.05] blur-3xl -mr-16 -mt-16"></div>

                            <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shadow-inner">
                                    <CreditCard className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                Order Summary
                            </h2>

                            <div className="space-y-6">
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-end mb-8">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] leading-none mb-1 block">Payable Amount</span>
                                            <p className="text-[9px] text-[var(--text-muted)] font-medium opacity-60 italic leading-none">Total for {cart.length} items</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl md:text-4xl font-black text-[var(--primary)] tracking-tighter leading-none">₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={confirmOrder}
                                    isLoading={isOrdering}
                                    variant="default"
                                    className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
                                >
                                    Confirm Order
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>

                                <div className="flex items-center justify-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default py-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 success-pulse"></div>
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secure Checkout</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
