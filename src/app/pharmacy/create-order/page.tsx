"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Package, User, CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { getErrorMessage, handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";

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

            // Create the order
            const orderData = {
                patient_id: selectedPatient.id,
                pharmacy_id: user.id,
                total_price: calculateTotal(),
                status: 'placed',
                initiator_type: 'pharmacy',
                acceptance_status: 'pending',
                acceptance_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                pharmacy_notes: pharmacyNotes || null
            };

            const order = await orders.createOrder(orderData);

            if (!order) throw new Error("Failed to create order");

            // Create order items (direct insert for now as it's a bulk operation)
            const itemsToInsert = cart.map(item => ({
                order_id: order.id,
                inventory_id: item.id,
                quantity: 1,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Send chat message to patient
            const orderMessage = `PHARMACY_ORDER_REQUEST\nORDER_ID:${order.id}\nPATIENT:${selectedPatient.full_name}\nTOTAL:₹${calculateTotal().toFixed(2)}\nITEMS:${cart.map(item => item.name).join(', ')}\nNOTES:${pharmacyNotes || 'None'}\nSTATUS:Pending Acceptance\nDEADLINE:${new Date(order.acceptance_deadline).toLocaleString()}`;

            await messages.sendMessage({
                sender_id: user.id,
                receiver_id: selectedPatient.id,
                content: orderMessage,
                order_id: order.id
            });

            toast.success("Order sent to patient for acceptance");
            router.push("/pharmacy");

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Failed to create order: " + getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedPatient, cart, pharmacyNotes, router, calculateTotal]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create Order</h2>
                    <p className="text-slate-500">Place an order on behalf of a connected patient.</p>
                </div>
            </div>

            {/* Patient Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Select Patient
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {patients.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p>No connected patients found</p>
                            <p className="text-sm">Share your invite link to connect with patients</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {patients.map(patient => (
                                <button
                                    key={patient.id}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedPatient?.id === patient.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-semibold text-slate-900">{patient.full_name}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Content */}
            {selectedPatient && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Inventory Selection */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Add Items
                                    </CardTitle>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search inventory..."
                                            value={searchQuery}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {filteredInventory.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p>No items found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {filteredInventory.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-900">{item.name}</div>
                                                        <div className="text-sm text-slate-500">
                                                            ₹{item.price.toFixed(2)} • Stock: {item.stock}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addToCart(item)}
                                                        disabled={item.stock <= 0 || cart.some(cartItem => cartItem.id === item.id)}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pharmacy Notes */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Additional Notes (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Add any notes for the patient..."
                                        value={pharmacyNotes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPharmacyNotes(e.target.value)}
                                        rows={3}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cart Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                    <p className="text-sm text-slate-600">
                                        For: <span className="font-semibold">{selectedPatient.full_name}</span>
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {cart.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p>No items added</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                                                {cart.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-slate-900 truncate">{item.name}</div>
                                                            <div className="text-sm text-slate-600">₹{item.price.toFixed(2)}</div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t pt-4">
                                                <div className="flex items-center justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full mt-6"
                                                onClick={submitOrder}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <><Loader className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                                ) : (
                                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Send for Patient Acceptance</>
                                                )}
                                            </Button>
                                            <p className="text-xs text-slate-500 text-center mt-3">
                                                Order will expire in 24 hours if not accepted
                                            </p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}