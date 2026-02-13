"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Package, User, CheckCircle2, AlertCircle, Loader, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { getErrorMessage, handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectedPatient {
    id: string;
    full_name: string;
}

export default function CreateOrderPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [patients, setPatients] = useState<ConnectedPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<ConnectedPatient | null>(null);
    const [cart, setCart] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [pharmacyNotes, setPharmacyNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
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

    const fetchConnectedPatients = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { connections } = createRepositories(supabase);
        const data = await handleAsyncError(
            () => connections.getConnectedPatients(user.id),
            "Failed to load connected patients"
        );

        if (data) {
            const connectedPatients = (data || []).map(conn => {
                const profile = Array.isArray(conn.profiles) ? conn.profiles[0] : conn.profiles;
                return {
                    id: profile?.id,
                    full_name: profile?.full_name
                };
            }).filter(p => p.id);
            setPatients(connectedPatients);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
        fetchConnectedPatients();
    }, [fetchInventory, fetchConnectedPatients]);

    const filteredInventory = useMemo(() =>
        inventory.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            item.stock > 0
        ), [inventory, searchQuery]
    );

    const addToCart = useCallback((item: InventoryItem) => {
        if (item.stock <= 0) {
            toast.error("Item is out of stock");
            return;
        }

        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            toast.error("Item already in cart");
            return;
        }

        setCart([...cart, item]);
        toast.success(`${item.name} added to cart`);
    }, [cart]);

    const removeFromCart = useCallback((itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    }, [cart]);

    const calculateTotal = useCallback(() => {
        return cart.reduce((total, item) => total + item.price, 0);
    }, [cart]);

    const submitOrder = useCallback(async () => {
        if (!selectedPatient) {
            toast.error("Please select a patient");
            return;
        }

        if (cart.length === 0) {
            toast.error("Please add items to the order");
            return;
        }

        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsSubmitting(false);
            return;
        }

        try {
            const { orders, messages } = createRepositories(supabase);

            // Structure items for RPC
            const orderItems = cart.map(item => ({
                inventory_id: item.id,
                quantity: 1, // Currently only supporting 1 unit per item in UI
                price: item.price
            }));

            // Calculate total
            const totalAmount = calculateTotal();

            // Process order via RPC (Atomic operation)
            const orderId = await handleAsyncError(
                () => orders.processPharmacyOrder({
                    pharmacy_id: user.id,
                    patient_id: selectedPatient.id,
                    items: orderItems,
                    total_price: totalAmount,
                    notes: pharmacyNotes || undefined
                }),
                "Failed to process order"
            );

            if (!orderId) throw new Error("Order creation failed");

            // Send chat message to patient
            const orderMessage = `PHARMACY_ORDER_REQUEST\nORDER_ID:${orderId}\nPATIENT:${selectedPatient.full_name}\nTOTAL:₹${totalAmount.toFixed(2)}\nITEMS:${cart.map(item => item.name).join(', ')}\nNOTES:${pharmacyNotes || 'None'}\nSTATUS:Pending Acceptance`;

            await messages.sendMessage({
                sender_id: user.id,
                receiver_id: selectedPatient.id,
                content: orderMessage,
                order_id: orderId
            });

            toast.success("Order sent to patient for acceptance");
            router.push("/pharmacy");

        } catch (error) {
            console.error("Error creating order:", error);
            // Error handling is mostly done by handleAsyncError but we catch any escaped ones
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedPatient, cart, pharmacyNotes, router, calculateTotal]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-[var(--text-light)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--app-bg)] p-4 md:p-8 pb-32">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto space-y-10"
            >
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--primary-light)] rounded-full w-fit">
                            <Plus className="w-3 h-3 text-[var(--primary)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Order Operations</span>
                        </div>
                        <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight">
                            Create <span className="text-[var(--primary)]">Order</span>
                        </h2>
                        <p className="text-sm font-medium text-[var(--text-muted)]">
                            Place a new fulfillment request on behalf of a connected customer.
                        </p>
                    </div>

                    {selectedPatient && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--border)] p-4 rounded-2xl flex items-center gap-4 shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-[var(--text-inverse)] font-black shadow-lg">
                                {selectedPatient.full_name[0]}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Active Patient</p>
                                <p className="text-sm font-bold text-[var(--text-main)]">{selectedPatient.full_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedPatient(null); setCart([]); }} className="h-8 w-8 rounded-full">
                                <X className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {!selectedPatient ? (
                        <motion.div
                            key="patient-selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="overflow-hidden border-2 border-[var(--border)] bg-[var(--card-bg)]/50 backdrop-blur-xl">
                                <CardHeader className="border-b border-[var(--border)] border-dashed bg-[var(--card-bg)]/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-xl font-black italic">Select Customer</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    {patients.length === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="w-20 h-20 rounded-full bg-[var(--surface-bg)] flex items-center justify-center mx-auto text-[var(--text-muted)] opacity-20">
                                                <AlertCircle className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-[var(--text-main)]">No Connections Found</h3>
                                                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
                                                    Share your store link with patients to start taking orders.
                                                </p>
                                            </div>
                                            <Button variant="outline" onClick={() => router.push('/pharmacy')} className="rounded-xl px-8">Return to Dashboard</Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {patients.map(patient => (
                                                <motion.button
                                                    key={patient.id}
                                                    whileHover={{ scale: 1.02, translateY: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedPatient(patient)}
                                                    className="p-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)] hover:shadow-xl transition-all text-left flex items-center gap-4 group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-bg)] group-hover:bg-[var(--primary-light)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors font-black text-lg">
                                                        {patient.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[var(--text-main)] italic">{patient.full_name}</h4>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Connected Patient</p>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="order-creation"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* Inventory Selection Section */}
                            <div className="lg:col-span-8 space-y-6">
                                <Card className="border-[var(--border)] bg-[var(--card-bg)]/80 backdrop-blur-sm overflow-hidden flex flex-col h-[700px]">
                                    <div className="p-6 border-b border-[var(--border)] border-dashed space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <CardTitle className="text-xl font-black italic">Select Products</CardTitle>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors w-5 h-5" />
                                            <Input
                                                placeholder="Search medicine stock..."
                                                value={searchQuery}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                                className="pl-12 h-12 rounded-xl bg-[var(--card-bg)] border-[var(--border)] focus:ring-2 focus:ring-[var(--primary-glow)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                        {filteredInventory.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                                <div className="w-16 h-16 rounded-3xl bg-[var(--surface-bg)] flex items-center justify-center text-[var(--text-muted)] opacity-20">
                                                    <Search className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">No match found</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {filteredInventory.map(item => {
                                                    const inCart = cart.some(cartItem => cartItem.id === item.id);
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            layoutId={`item-${item.id}`}
                                                            className={`p-4 rounded-2xl border-2 transition-all group flex items-start justify-between ${inCart ? 'bg-[var(--primary-light)] border-[var(--primary)]' : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--primary-light)]'}`}
                                                        >
                                                            <div className="space-y-1">
                                                                <h4 className="font-black text-[var(--text-main)] italic truncate max-w-[150px]">{item.name}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-[var(--primary)]">₹{item.price.toFixed(2)}</p>
                                                                    <div className="w-1 h-1 rounded-full bg-[var(--border)]"></div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{item.stock} Units</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="icon"
                                                                variant={inCart ? "default" : "outline"}
                                                                onClick={() => !inCart && addToCart(item)}
                                                                className={`h-10 w-10 rounded-xl transition-all ${inCart ? 'shadow-lg' : ''}`}
                                                                disabled={inCart}
                                                            >
                                                                {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                            </Button>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="border-[var(--border)] border-dashed bg-[var(--card-bg)]/50">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center text-[var(--warning)]">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-xl font-black italic">Pharmacy Notes</CardTitle>
                                        </div>
                                        <Textarea
                                            placeholder="Add instructions, dosage info, or a personal note for the patient..."
                                            value={pharmacyNotes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPharmacyNotes(e.target.value)}
                                            className="min-h-[120px] rounded-2xl border-[var(--border)] focus:ring-2 focus:ring-[var(--warning-light)]"
                                        />
                                    </div>
                                </Card>
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className="lg:col-span-4 mt-6 lg:mt-0">
                                <Card className="border-2 border-[var(--text-main)] bg-[var(--text-main)] text-[var(--text-inverse)] shadow-2xl rounded-[2.5rem] overflow-hidden sticky top-8">
                                    <div className="p-8 space-y-8">
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black italic tracking-tighter">Order Summary</h3>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--text-inverse)]/10 rounded-full w-fit">
                                                <CheckCircle2 className="w-3 h-3 text-[var(--success-500)]" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--success-light)]">Pending Review</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {cart.length === 0 ? (
                                                <div className="py-10 text-center space-y-4 opacity-40">
                                                    <Package className="w-10 h-10 mx-auto" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Bag is Empty</p>
                                                </div>
                                            ) : (
                                                <AnimatePresence>
                                                    {cart.map(item => (
                                                        <motion.div
                                                            key={item.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="flex items-center justify-between group"
                                                        >
                                                            <div className="space-y-0.5">
                                                                <p className="font-bold text-sm italic line-clamp-1">{item.name}</p>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-inverse)]/50">1 x ₹{item.price.toFixed(2)}</p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="h-8 w-8 rounded-lg hover:bg-[var(--text-inverse)]/10 text-[var(--text-inverse)]/40 hover:text-[var(--error)] transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            )}
                                        </div>

                                        <div className="space-y-6 pt-6 border-t border-[var(--text-inverse)]/10 border-dashed">
                                            <div className="flex items-end justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-inverse)]/40">Total Amount</p>
                                                    <p className="text-4xl font-black">₹{calculateTotal().toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="default"
                                                onClick={submitOrder}
                                                disabled={isSubmitting || cart.length === 0}
                                                className="w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl glow-primary"
                                            >
                                                {isSubmitting ? (
                                                    <><Loader className="w-5 h-5 mr-3 animate-spin" /> Transmitting...</>
                                                ) : (
                                                    <><CheckCircle2 className="w-5 h-5 mr-3 text-white" /> Dispatch Order</>
                                                )}
                                            </Button>


                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}