"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingCart, X, Store, Loader, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { InventoryItem, CartItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";

export default function PatientSearchPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchInventory();
    }, []);

    async function fetchInventory() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: connections } = await supabase
            .from("connections")
            .select("pharmacy_id")
            .eq("patient_id", user.id);

        const connectedIds = connections?.map(c => c.pharmacy_id) || [];

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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().trim().includes(search.toLowerCase().trim())
    );

    const addToCart = (item: InventoryItem) => {
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
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
        toast.info("Removed from cart");
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId);
            if (!item) return prev;

            const newQuantity = Math.max(1, item.quantity + delta);
            return prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
        });
    };

    const sendOrderNotificationToPharmacy = async (order: any, patientId: string, pharmacyId: string) => {
        try {
            // Check if patient is connected to this pharmacy
            const { data: connection } = await supabase
                .from("connections")
                .select("*")
                .eq("patient_id", patientId)
                .eq("pharmacy_id", pharmacyId)
                .single();

            if (!connection) {
                console.log("No connection found, skipping chat notification");
                return;
            }

            // Create order summary
            const orderItems = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
            const orderSummary = `New Order #${order.id.slice(0, 8)}: ${orderItems}\nTotal: ₹${order.total_price.toFixed(2)}`;

            // Verify pharmacy profile exists to prevent FK violation
            const { data: pharmacyProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", pharmacyId)
                .single();

            if (!pharmacyProfile) {
                console.warn("Pharmacy profile not found, skipping notification");
                return;
            }

            // Send message to pharmacy
            const messageContent = orderSummary + `\n\nORDER_ID:${order.id}\nORDER_STATUS:${order.status}\nORDER_TOTAL:${order.total_price}`;
            const { error: messageError } = await supabase
                .from("messages")
                .insert([{
                    sender_id: patientId,
                    receiver_id: pharmacyId,
                    content: messageContent
                }])
                .select();

            if (messageError) {
                console.error("Error sending order notification:", {
                    message: messageError.message,
                    details: messageError.details,
                    hint: messageError.hint,
                    code: messageError.code
                });
                toast.error("Order placed, but failed to notify pharmacy chat.");
            }
        } catch (error: unknown) {
            const err = error as Error;
            console.error("Error in sendOrderNotificationToPharmacy:", err.message || err);
        }
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;

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
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="container mx-auto max-w-4xl p-6 pb-24">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Find Medication</h1>
                    <p className="text-slate-500">Search inventory from your connected pharmacies</p>
                </div>
                <div className="relative">
                    <Button variant="outline" size="icon" className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        {cart.length > 0 && (
                            <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 p-0 text-xs text-white">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </Badge>
                        )}
                    </Button>
                </div>
            </header>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search for medication (e.g. Aspirin)..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Store className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Connected Pharmacies</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        You need to connect with a pharmacy to see their inventory.
                        Ask your pharmacist for their invite link.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
                            <CardContent className="p-4">
                                <div className="mb-2 flex items-start justify-between">
                                    <div className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                        {item.profiles?.full_name || "Pharmacy"}
                                    </div>
                                    <span className="font-bold text-slate-900">₹{item.price}</span>
                                </div>
                                <h3 className="mb-1 truncate text-lg font-semibold text-slate-900" title={item.name}>
                                    {item.name}
                                </h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${item.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                                            {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Qty:</span>
                                        <button
                                            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                                            onClick={() => {
                                                const cartItem = cart.find(i => i.id === item.id);
                                                if (cartItem && cartItem.quantity > 1) {
                                                    updateQuantity(item.id, -1);
                                                }
                                            }}
                                            disabled={!cart.find(i => i.id === item.id)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">
                                            {cart.find(i => i.id === item.id)?.quantity || 0}
                                        </span>
                                        <button
                                            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                                            onClick={() => {
                                                const cartItem = cart.find(i => i.id === item.id);
                                                if (!cartItem) {
                                                    addToCart(item);
                                                } else {
                                                    updateQuantity(item.id, 1);
                                                }
                                            }}
                                            disabled={item.stock <= 0}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Cart Sheet / Overlay could go here, for now using a simple bottom fixed bar if cart has items */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg md:p-6">
                    <div className="container mx-auto max-w-4xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total ({cart.length} items)</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ₹${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setCart([])}>Clear</Button>
                                <Button onClick={placeOrder} isLoading={isOrdering}>
                                    Place Order
                                </Button>
                            </div>
                        </div>
                        {/* Mini cart list */}
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex min-w-[200px] items-center gap-2 rounded-md border bg-slate-50 px-3 py-2">
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.quantity} x ₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="text-slate-400 hover:text-slate-600 p-1"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="text-sm font-medium px-2">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
