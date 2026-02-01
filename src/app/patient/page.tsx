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
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { motion } from "framer-motion";
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

const OrderConfirmationModal = dynamic(
  () => import("@/components/patient/OrderConfirmationModal").then(mod => ({ default: mod.OrderConfirmationModal })),
  { 
    loading: () => null,
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
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [connectedPharmacies, setConnectedPharmacies] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function fetchData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch connections with profiles
        const { data: connections } = await supabase
            .from("connections")
            .select("pharmacy_id, profiles:pharmacy_id(id, full_name)")
            .eq("patient_id", user.id);

        // Handle case where profiles might be returned as an array (Supabase default for some relations)
        const pharmacies = connections?.map(c => {
            const profile = c.profiles;
            return Array.isArray(profile) ? profile[0] : profile;
        }).filter(Boolean) || [];

        setConnectedPharmacies(pharmacies);

        const connectedIds = pharmacies.map((p: any) => p.id);

        if (connectedIds.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("inventory")
            .select("*, profiles:pharmacy_id(full_name)")
            .in("pharmacy_id", connectedIds)
            .order("name");

        if (!error) setItems(data as unknown as InventoryItem[] || []);
        else {
            console.error(error);
            toast.error("Failed to load inventory");
        }
        setLoading(false);
    }

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
        try {
            // Create order summary
            const orderItems = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
            const orderSummary = `New Order #${order.id.slice(0, 8)}: ${orderItems}\nTotal: ₹${order.total_price.toFixed(2)}`;

            // Send message to pharmacy
            const messageContent = orderSummary + `\n\nORDER_ID:${order.id}\nORDER_STATUS:${order.status}\nORDER_TOTAL:${order.total_price}`;
            const { error: messageError } = await supabase
                .from("messages")
                .insert([{
                    sender_id: patientId,
                    receiver_id: pharmacyId,
                    content: messageContent
                }]);

            if (messageError) {
                console.error("Error sending order notification:", messageError);
                toast.error("Order placed, but failed to notify pharmacy chat.");
            }
        } catch (error: unknown) {
            console.error("Error in sendOrderNotificationToPharmacy:", error);
        }
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;
        setShowOrderConfirmation(true);
    };

    const confirmOrder = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in to place an order");
            router.push("/");
            return;
        }

        setIsOrdering(true);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const pharmacyId = cart[0].pharmacy_id;

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                patient_id: user.id,
                pharmacy_id: pharmacyId,
                total_price: total,
                status: 'placed'
            })
            .select()
            .single();

        if (orderError) {
            console.error("Order error:", orderError);
            toast.error("Failed to place order: " + orderError.message);
            setIsOrdering(false);
            return;
        }

        const orderItems = cart.map(item => ({
            order_id: order.id,
            inventory_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
        }));

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            console.error("Items error:", itemsError);
            toast.error("Failed to save order items");
        } else {
            // Send order notification to pharmacy
            await sendOrderNotificationToPharmacy(order, user.id, pharmacyId);

            setCart([]);
            toast.success("Order placed successfully!");
            router.push("/patient/orders");
        }
        setIsOrdering(false);
        setShowOrderConfirmation(false);
    };

    const cancelOrder = () => {
        setShowOrderConfirmation(false);
    };

    // Memoized cart total to prevent unnecessary recalculations
    const cartTotal = useMemo(() => 
        cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2), [cart]
    );

    if (loading) return (
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
        <div className="container mx-auto p-4 md:p-6 pb-24 space-y-8">

            {/* Header with Search and Cart */}
            <header className="flex items-center justify-between">
                <div className="section-header">
                    <h1 className="section-title">Patient Portal</h1>
                    <p className="section-subtitle">Welcome back</p>
                </div>
                <div className="relative">
                    <Button variant="outline" size="icon" className="relative rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                        <ShoppingCart className="h-5 w-5 text-slate-600" />
                        {cart.length > 0 && (
                            <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 p-0 text-[10px] text-white ring-2 ring-white">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </Badge>
                        )}
                    </Button>
                </div>
            </header>

            {/* Quick Chat Widget - Priority #1 */}
            {connectedPharmacies.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            Recent Conversations
                        </h2>
                        <Link href="/patient/chats" className="text-xs font-bold text-indigo-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {connectedPharmacies.slice(0, 3).map((pharma) => (
                            <Link key={pharma.id} href={`/patient/chats?pharmacyId=${pharma.id}`}>
                                <Card className="hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-indigo-100 shadow-lg group-hover:scale-105 transition-transform">
                                            {pharma.full_name?.[0] || <Store className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 truncate">{pharma.full_name || "Pharmacy"}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <p className="text-xs text-slate-500 font-medium">Available Now</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Medication Search */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Find Medication</h2>
                </div>

                <div className="relative mb-6 group">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search for medication (e.g. Aspirin)..."
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        inputMode="text"
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Connected Pharmacies</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm mb-6">
                            Connect with a pharmacy to browse their inventory and start ordering.
                        </p>
                        <Link href="/patient/pharmacies">
                            <Button>Find a Pharmacy</Button>
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

            {/* Cart Overlay */}
            {cart.length > 0 && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-0 left-0 right-0 border-t bg-white/80 backdrop-blur-lg p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:p-6 z-50"
                >
                    <div className="container mx-auto max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</p>
                                <p className="text-2xl font-black text-slate-900">
                                    ₹{cartTotal}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" className="text-slate-500 hover:text-rose-500" onClick={() => setCart([])}>Clear</Button>
                                <Button onClick={placeOrder} isLoading={isOrdering} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl shadow-lg shadow-indigo-200">
                                    Place Order
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Floating Action Button for Chat (Mobile) */}
            <Link href="/patient/chats">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center z-40"
                >
                    <MessageCircle className="w-6 h-6" />
                </motion.button>
            </Link>

            {/* Order Confirmation Modal */}
            <OrderConfirmationModal
                isOpen={showOrderConfirmation}
                cart={cart}
                total={parseFloat(cartTotal)}
                onConfirm={confirmOrder}
                onCancel={cancelOrder}
                isOrdering={isOrdering}
            />
        </div>
    );
}
