"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingCart, MessageCircle, ArrowRight, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryItem, CartItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { debounce, storage } from "@/lib/utils-performance";
import dynamic from 'next/dynamic';

// Dynamic imports for better code splitting
const VirtualizedMedicationList = dynamic(
    () => import("@/components/patient/VirtualizedMedicationList").then(mod => ({ default: mod.VirtualizedMedicationList })),
    {
        loading: () => <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><SkeletonCard count={6} /></div>,
        ssr: false
    }
);


const MedicationCard = dynamic(
    () => import("@/components/patient/MedicationCard").then(mod => ({ default: mod.MedicationCard })),
    {
        ssr: false
    }
);

export default function PatientSearchPage() {
    const { user, loading: userLoading } = useUser();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [connectedPharmacies, setConnectedPharmacies] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = storage.get('patient_cart');
        if (savedCart) {
            setCart(savedCart);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        const debouncedSearchHandler = debounce((value: string) => {
            setDebouncedSearch(value);
        }, 300);

        debouncedSearchHandler(search);
    }, [search]);

const fetchData = useCallback(async () => {
        if (!user) {
            return;
        }

        const { connections: connRepo } = createRepositories(supabase);

        // Fetch connections with profiles
        const connections = await handleAsyncError(
            () => connRepo.getConnectedPharmacies(user.id),
            "Failed to load connected pharmacies"
        );

        if (connections && Array.isArray(connections)) {
            const pharmacies = connections.map((c: any) => {
                const profile = c.profiles;
                return Array.isArray(profile) ? profile[0] : profile;
            }).filter(Boolean) || [];

            setConnectedPharmacies(pharmacies);

            const connectedIds = pharmacies.map((p: any) => p.id);

            if (connectedIds.length > 0) {
                const { data, error } = await supabase
                    .from("inventory")
                    .select("*, profiles:pharmacy_id(full_name)")
                    .in("pharmacy_id", connectedIds)
                    .order("name");

                if (!error) {
                    setItems(data as unknown as InventoryItem[] || []);
                } else {
                    handleAsyncError(() => Promise.reject(error), "Failed to load inventory");
                }
            } else {
                setItems([]);
            }
        }
        setLoading(false);
    }, []);

useEffect(() => {
        if (!userLoading && user) {
            fetchData();
        }
    }, [fetchData, userLoading, user]);

    // Memoized filtered items to prevent unnecessary re-renders
    const filteredItems = useMemo(() => {
        if (!debouncedSearch.trim()) return items;
        return items.filter(item =>
            item.name.toLowerCase().trim().includes(debouncedSearch.toLowerCase().trim())
        );
    }, [items, debouncedSearch]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            storage.set('patient_cart', cart);
        } else {
            storage.remove('patient_cart');
        }
    }, [cart]);

    const addToCart = useCallback((item: InventoryItem) => {
        if (item.stock <= 0) return;

        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                toast.success(`Added another ${item.name} to cart`);
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            toast.success(`Added ${item.name} to cart`);
            return [...prev, { ...item, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
        toast.info("Removed from cart");
    }, []);

    const updateQuantity = useCallback((itemId: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId);
            if (!item) return prev;

            const newQuantity = Math.max(1, item.quantity + delta);
            return prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
        });
    }, []);

    const sendOrderNotificationToPharmacy = async (order: any, patientId: string, pharmacyId: string) => {
        const { messages: messagesRepo } = createRepositories(supabase);

        // Create order summary
        const orderItemsSummary = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
        const orderSummary = `New Order #${order.id.slice(0, 8)}: ${orderItemsSummary}\nTotal: ₹${order.total_price.toFixed(2)}`;

        // Send message to pharmacy
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

    const placeOrder = () => {
        if (cart.length === 0) return;
        router.push("/patient/cart");
    };


    // Memoized cart total to prevent unnecessary recalculations
    const cartTotal = useMemo(() =>
        cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2), [cart]
    );

    if (loading || userLoading) return (
        <div className="container mx-auto p-4 md:p-6 pb-24 space-y-8">
            {/* Skeleton Header */}
            <header className="flex items-center justify-between">
                <div className="section-header">
                    <div className="h-8 w-32 bg-slate-100 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full animate-pulse"></div>
            </header>

            {/* Skeleton Search */}
            <section>
                <div className="mb-4">
                    <div className="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="relative mb-6">
                    <div className="h-12 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
                </div>

                {/* Skeleton Medication Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonCard count={6} />
                </div>
            </section>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--app-bg)] pb-24">
            <div className="container mx-auto p-4 md:p-6 space-y-8">
                {/* Header Section */}
                <header className="flex items-center justify-between glass-card p-6 rounded-2xl slide-up">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                            Available <span className="text-[var(--primary)]">Medications</span>
                        </h2>
                        <p className="text-sm font-medium text-[var(--text-muted)]">
                            From your connected pharmacies
                        </p>
                    </div>
                </header>

                {/* Quick Chat Widget */}
                {connectedPharmacies.length > 0 && (
                    <section className="space-y-4 fade-in">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                                Your Pharmacists
                            </h2>
                            <Link href="/patient/chats" className="text-xs font-black uppercase tracking-widest text-[var(--primary)] hover:opacity-70 transition-opacity">
                                View All
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {connectedPharmacies.slice(0, 3).map((pharma) => (
                                <Link key={pharma.id} href={`/patient/chats?pharmacyId=${pharma.id}`}>
                                    <div className="glass-card p-4 rounded-xl flex items-center gap-4 group cursor-pointer hover:border-[var(--primary)] transition-all duration-300">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-110 transition-transform">
                                            {pharma.full_name?.[0] || "P"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--text-main)] truncate">{pharma.full_name || "Pharmacy"}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 success-pulse"></div>
                                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Available</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[var(--text-light)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Medication Search Section */}
                <section className="space-y-6 fade-in">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-[var(--text-main)]">Find Medications</h2>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                            <Input
                                placeholder="Search products, medications..."
                                className="pl-12 h-14 rounded-2xl border-[var(--border)] focus:ring-4 focus:ring-[var(--primary-glow)] transition-all text-base"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {items.length === 0 && !loading ? (
                        <div className="glass-card p-12 rounded-3xl flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                                <Store className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-[var(--text-main)]">No connected pharmacies</h3>
                                <p className="text-[var(--text-muted)] max-w-sm">
                                    Connect with your local pharmacist to see medications available for purchase.
                                </p>
                            </div>
                            <Link href="/patient/pharmacies">
                                <Button variant="default" className="px-8 h-12 rounded-xl">Browse Pharmacies</Button>
                            </Link>
                        </div>
                    ) : (
                        <VirtualizedMedicationList
                            items={filteredItems}
                            cart={cart}
                            onAddToCart={addToCart}
                            onUpdateQuantity={updateQuantity}
                            maxVisible={6}
                        />
                    )}
                </section>
            </div>

            {/* Sticky Cart Overlay */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 p-4 md:p-8 z-50 pointer-events-none"
                    >
                        <div className="container mx-auto max-w-5xl pointer-events-auto">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="glass-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl p-5 md:p-7 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-[var(--primary)] border-opacity-30 flex flex-col md:flex-row items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em]">Active Cart</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold text-[var(--text-muted)]">₹</span>
                                            <span className="text-3xl font-black text-[var(--text-main)] tracking-tighter">{cartTotal}</span>
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-3 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                                        <div className="flex -space-x-3 px-1">
                                            {cart.slice(0, 4).map((item, i) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ scale: 0.8, x: -10 }}
                                                    animate={{ scale: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="w-10 h-10 rounded-xl bg-gradient-primary border-2 border-white dark:border-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg"
                                                >
                                                    {item.name[0]}
                                                </motion.div>
                                            ))}
                                            {cart.length > 4 && (
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-[10px] shadow-lg">
                                                    +{cart.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <div className="pr-3 border-l border-slate-300/30 dark:border-slate-600/30 pl-3">
                                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{cart.length} ITEMS</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <Button
                                        variant="ghost"
                                        className="h-14 px-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95 transition-all"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to clear your cart?")) {
                                                setCart([]);
                                            }
                                        }}
                                    >
                                        Clear Cart
                                    </Button>
                                    <Button
                                        onClick={placeOrder}
                                        variant="default"
                                        className="flex-1 md:flex-none h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl glow-primary hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        Review & Checkout
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Floating Chat */}
            <div className="fixed bottom-6 right-6 md:hidden z-40">
                <Link href="/patient/chats">
                    <button className="w-14 h-14 bg-gradient-primary rounded-2xl shadow-xl flex items-center justify-center text-white scale-110 active:scale-95 transition-all glow-primary">
                        <MessageCircle className="w-7 h-7" />
                    </button>
                </Link>
            </div>

        </div>
    );
}
