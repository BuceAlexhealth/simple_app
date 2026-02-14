"use client";

import { AlertTriangle, Package, Clock, X, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import { useUser } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface InventoryAlertsCardProps {
    onViewInventory?: () => void;
}

export function InventoryAlertsCard({ onViewInventory }: InventoryAlertsCardProps) {
    const { user } = useUser();
    const { 
        criticalStock, 
        lowStock, 
        outOfStock, 
        expiringBatches, 
        totalAlerts,
        hasAlerts,
        isLoading 
    } = useInventoryAlerts(user?.id);

    if (isLoading) {
        return (
            <Card className="border-[var(--border)]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Inventory Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[var(--text-muted)]">Loading alerts...</p>
                </CardContent>
            </Card>
        );
    }

    if (!hasAlerts) {
        return (
            <Card className="border-[var(--success)] bg-[var(--success-bg)]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <p className="font-medium text-[var(--success)]">All Good!</p>
                            <p className="text-sm text-[var(--text-muted)]">No inventory alerts at this time</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-[var(--warning)]">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                        Inventory Alerts
                    </CardTitle>
                    <Badge variant="warning" className="text-xs">
                        {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Critical Stock */}
                {criticalStock.data && criticalStock.data.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-[var(--error-bg)] rounded-lg border border-[var(--error)]/30"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[var(--error)] flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Critical Stock ({criticalStock.data.length})
                            </p>
                            <Badge variant="destructive" className="text-xs">Reorder Now</Badge>
                        </div>
                        <div className="space-y-1">
                            {criticalStock.data.slice(0, 3).map(item => (
                                <div key={item.id} className="flex justify-between text-xs">
                                    <span className="text-[var(--text-main)]">{item.name}</span>
                                    <span className="text-[var(--error)] font-medium">{item.stock} units</span>
                                </div>
                            ))}
                            {criticalStock.data.length > 3 && (
                                <p className="text-xs text-[var(--text-muted)]">+{criticalStock.data.length - 3} more</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Low Stock */}
                {lowStock.data && lowStock.data.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning)]/30"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[var(--warning)] flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Low Stock ({lowStock.data.length})
                            </p>
                            <Badge variant="warning" className="text-xs">Order Soon</Badge>
                        </div>
                        <div className="space-y-1">
                            {lowStock.data.slice(0, 3).map(item => (
                                <div key={item.id} className="flex justify-between text-xs">
                                    <span className="text-[var(--text-main)]">{item.name}</span>
                                    <span className="text-[var(--warning)] font-medium">{item.stock} units</span>
                                </div>
                            ))}
                            {lowStock.data.length > 3 && (
                                <p className="text-xs text-[var(--text-muted)]">+{lowStock.data.length - 3} more</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Expiring Batches */}
                {expiringBatches.data && expiringBatches.data.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-[var(--info-bg)] rounded-lg border border-[var(--info)]/30"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[var(--info)] flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Expiring Soon ({expiringBatches.data.length})
                            </p>
                            <Badge variant="secondary" className="text-xs bg-[var(--info)]/20 text-[var(--info)]">30 days</Badge>
                        </div>
                        <div className="space-y-1">
                            {expiringBatches.data.slice(0, 3).map(batch => (
                                <div key={batch.id} className="flex justify-between text-xs">
                                    <span className="text-[var(--text-main)]">
                                        {batch.inventory?.name} ({batch.batch_code})
                                    </span>
                                    <span className="text-[var(--info)] font-medium">
                                        {new Date(batch.expiry_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                            {expiringBatches.data.length > 3 && (
                                <p className="text-xs text-[var(--text-muted)]">+{expiringBatches.data.length - 3} more</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* View All Button */}
                {onViewInventory && (
                    <Button 
                        variant="outline" 
                        className="w-full mt-2" 
                        onClick={onViewInventory}
                    >
                        View All Inventory
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
