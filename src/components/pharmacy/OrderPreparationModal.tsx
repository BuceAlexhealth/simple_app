"use client";

import { useState, useEffect } from "react";
import { X, Package, Calendar, CheckCircle2, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createRepositories } from "@/lib/repositories";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isExpired, isExpiringSoon } from "@/lib/utils/date";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
    id: string;
    order_id: string;
    inventory_id: string;
    quantity: number;
    price_at_time: number;
    inventory?: {
        name: string;
        brand_name?: string;
    };
}

interface Order {
    id: string;
    created_at: string;
    patient_id: string | null;
    pharmacy_id: string;
    total_price: number;
    status: string;
    fulfillment_status?: string;
}

interface Batch {
    id: string;
    batch_code: string;
    expiry_date: string;
    remaining_qty: number;
    quantity: number;
}

interface BatchSelection {
    batchId: string;
    batchCode: string;
    qty: number;
}

interface OrderItemFulfillment {
    inventoryId: string;
    inventoryName: string;
    requestedQty: number;
    fulfilledQty: number;
    batchSelections: BatchSelection[];
    notes: string;
}

interface OrderPreparationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    items: OrderItem[];
    onFulfillmentComplete: () => void;
}

export function OrderPreparationModal({
    isOpen,
    onClose,
    order,
    items,
    onFulfillmentComplete
}: OrderPreparationModalProps) {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [itemFulfillments, setItemFulfillments] = useState<Map<string, OrderItemFulfillment>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const inventoryIds = items.map(i => i.inventory_id);

    const { data: batchesData, isLoading: loadingBatches } = useQuery({
        queryKey: ['batches-for-order', order.id, inventoryIds.join(',')],
        queryFn: async () => {
            const { batches } = createRepositories(supabase);
            const results: Map<string, Batch[]> = new Map();
            
            for (const item of items) {
                const itemBatches = await batches.getBatchesByInventoryId(item.inventory_id);
                results.set(item.inventory_id, itemBatches);
            }
            return results;
        },
        enabled: isOpen && items.length > 0,
    });

    useEffect(() => {
        if (items.length > 0) {
            const newFulfillments = new Map<string, OrderItemFulfillment>();
            items.forEach(item => {
                newFulfillments.set(item.inventory_id, {
                    inventoryId: item.inventory_id,
                    inventoryName: item.inventory?.name || 'Unknown Product',
                    requestedQty: item.quantity,
                    fulfilledQty: item.quantity,
                    batchSelections: [],
                    notes: ''
                });
            });
            setItemFulfillments(newFulfillments);
        }
    }, [items]);

    const updateFulfillment = (inventoryId: string, updates: Partial<OrderItemFulfillment>) => {
        setItemFulfillments(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(inventoryId);
            if (existing) {
                newMap.set(inventoryId, { ...existing, ...updates });
            }
            return newMap;
        });
    };

    const addBatchSelection = (inventoryId: string, batch: Batch) => {
        const fulfillment = itemFulfillments.get(inventoryId);
        if (!fulfillment) return;

        const existing = fulfillment.batchSelections.find(b => b.batchId === batch.id);
        if (existing) return;

        const currentTotal = fulfillment.batchSelections.reduce((sum, b) => sum + b.qty, 0);
        const available = batch.remaining_qty;
        const needed = fulfillment.requestedQty - currentTotal;
        const toAdd = Math.min(available, needed);

        if (toAdd <= 0) {
            toast.warning("Sufficient quantity already selected");
            return;
        }

        updateFulfillment(inventoryId, {
            batchSelections: [...fulfillment.batchSelections, {
                batchId: batch.id,
                batchCode: batch.batch_code,
                qty: toAdd
            }]
        });
    };

    const removeBatchSelection = (inventoryId: string, batchId: string) => {
        const fulfillment = itemFulfillments.get(inventoryId);
        if (!fulfillment) return;

        updateFulfillment(inventoryId, {
            batchSelections: fulfillment.batchSelections.filter(b => b.batchId !== batchId)
        });
    };

    const updateBatchQty = (inventoryId: string, batchId: string, qty: number) => {
        const fulfillment = itemFulfillments.get(inventoryId);
        if (!fulfillment) return;

        const batch = batchesData?.get(inventoryId)?.find(b => b.id === batchId);
        if (!batch) return;

        const clampedQty = Math.max(0, Math.min(qty, batch.remaining_qty));

        updateFulfillment(inventoryId, {
            batchSelections: fulfillment.batchSelections.map(b => 
                b.batchId === batchId ? { ...b, qty: clampedQty } : b
            )
        });
    };

    const getBatchStatus = (batch: Batch) => {
        if (batch.remaining_qty === 0) return 'depleted';
        if (isExpired(batch.expiry_date)) return 'expired';
        if (isExpiringSoon(batch.expiry_date)) return 'expiring';
        return 'active';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    const validateFulfillment = (): boolean => {
        for (const [inventoryId, fulfillment] of itemFulfillments) {
            const totalSelected = fulfillment.batchSelections.reduce((sum, b) => sum + b.qty, 0);
            if (totalSelected !== fulfillment.requestedQty) {
                toast.error(`${fulfillment.inventoryName}: Please select exactly ${fulfillment.requestedQty} units`);
                return false;
            }
        }
        return true;
    };

    const handleSubmitFulfillment = async () => {
        if (!validateFulfillment()) return;

        setIsSubmitting(true);
        try {
            const { orders } = createRepositories(supabase);

            for (const [inventoryId, fulfillment] of itemFulfillments) {
                for (const batchSelection of fulfillment.batchSelections) {
                    await orders.createFulfillment({
                        order_id: order.id,
                        inventory_id: inventoryId,
                        batch_id: batchSelection.batchId,
                        requested_qty: fulfillment.requestedQty,
                        fulfilled_qty: batchSelection.qty,
                        notes: fulfillment.notes || undefined,
                        fulfilled_by: user?.id
                    });

                    const { batches } = createRepositories(supabase);
                    const batch = batchesData?.get(inventoryId)?.find(b => b.id === batchSelection.batchId);
                    if (batch) {
                        await batches.consumeBatches(
                            inventoryId, 
                            batchSelection.qty, 
                            order.id,
                            user?.id
                        );
                    }
                }
            }

            await orders.updateOrderFulfillmentStatus(order.id, 'completed');

            toast.success("Order fulfilled successfully!");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onFulfillmentComplete();
            onClose();
        } catch (error) {
            console.error("Fulfillment error:", error);
            toast.error("Failed to process fulfillment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl max-h-[90vh] bg-[var(--surface-bg)] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-main)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-main)]">Prepare Order</h2>
                        <p className="text-sm text-[var(--text-muted)]">
                            Order #{order.id.slice(0, 8)} • Total: ₹{order.total_price.toFixed(2)}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingBatches ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                            <p className="text-sm text-[var(--text-muted)]">Loading batch information...</p>
                        </div>
                    ) : (
                        items.map((item, index) => {
                            const fulfillment = itemFulfillments.get(item.inventory_id);
                            const batches = batchesData?.get(item.inventory_id) || [];
                            const totalSelected = fulfillment?.batchSelections.reduce((sum, b) => sum + b.qty, 0) || 0;
                            const isComplete = totalSelected === item.quantity;
                            const isExpanded = expandedItems.has(item.inventory_id);

                            return (
                                <Card key={item.id} className={isComplete ? 'border-[var(--success)] bg-[var(--success-bg)]/30' : ''}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded bg-[var(--primary-light)] flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
                                                    {index + 1}
                                                </span>
                                                <CardTitle className="text-base">
                                                    {item.inventory?.name || `Product #${index + 1}`}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={isComplete ? 'success' : 'warning'}>
                                                    {totalSelected}/{item.quantity} selected
                                                </Badge>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setExpandedItems(prev => {
                                                            const newSet = new Set(prev);
                                                            if (newSet.has(item.inventory_id)) {
                                                                newSet.delete(item.inventory_id);
                                                            } else {
                                                                newSet.add(item.inventory_id);
                                                            }
                                                            return newSet;
                                                        });
                                                    }}
                                                >
                                                    {isExpanded ? <X className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Requested: {item.quantity} units • ₹{item.price_at_time}/unit
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-3 space-y-3">
                                                        <p className="text-sm font-medium text-[var(--text-muted)]">Select Batches (FEFO)</p>
                                                        
                                                        {batches.length === 0 ? (
                                                            <p className="text-sm text-[var(--error)]">No batches available for this product</p>
                                                        ) : (
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                {batches.map(batch => {
                                                                    const status = getBatchStatus(batch);
                                                                    const selected = fulfillment?.batchSelections.find(b => b.batchId === batch.id);
                                                                    return (
                                                                        <div 
                                                                            key={batch.id}
                                                                            className={`flex items-center justify-between p-2 rounded-lg ${
                                                                                status === 'expired' ? 'bg-[var(--error-bg)]' :
                                                                                status === 'expiring' ? 'bg-[var(--warning-bg)]' :
                                                                                status === 'depleted' ? 'bg-[var(--surface-bg)]' :
                                                                                'bg-[var(--surface-bg)]'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-medium text-sm">{batch.batch_code}</span>
                                                                                        <Badge variant={status === 'active' ? 'success' : status === 'expiring' ? 'warning' : 'destructive'} className="text-xs">
                                                                                            {status === 'expired' ? 'Expired' : 
                                                                                             status === 'expiring' ? 'Expiring' :
                                                                                             status === 'depleted' ? 'Depleted' : 'Active'}
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <p className="text-xs text-[var(--text-muted)]">
                                                                                        Exp: {formatDate(batch.expiry_date)} • Available: {batch.remaining_qty}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {selected ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Input
                                                                                            type="number"
                                                                                            min={0}
                                                                                            max={batch.remaining_qty}
                                                                                            value={selected.qty}
                                                                                            onChange={(e) => updateBatchQty(item.inventory_id, batch.id, parseInt(e.target.value) || 0)}
                                                                                            className="w-16 h-8 text-center"
                                                                                        />
                                                                                        <Button 
                                                                                            variant="ghost" 
                                                                                            size="icon"
                                                                                            onClick={() => removeBatchSelection(item.inventory_id, batch.id)}
                                                                                            className="h-8 w-8 text-[var(--error)]"
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Button 
                                                                                        variant="outline" 
                                                                                        size="sm"
                                                                                        onClick={() => addBatchSelection(item.inventory_id, batch)}
                                                                                        disabled={status === 'expired' || status === 'depleted'}
                                                                                    >
                                                                                        <Plus className="w-4 h-4" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="pt-2 border-t border-[var(--border)]">
                                                            <Input
                                                                placeholder="Notes (optional) - e.g., partial fulfillment, substitution..."
                                                                value={fulfillment?.notes || ''}
                                                                onChange={(e) => updateFulfillment(item.inventory_id, { notes: e.target.value })}
                                                                className="text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-main)]">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmitFulfillment}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Complete Fulfillment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
