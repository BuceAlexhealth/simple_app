"use client";

import { useState } from "react";
import { Plus, ClipboardList, Store } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OrderFilters } from "@/components/pharmacy/OrderFilters";
import { InviteShareCard } from "@/components/pharmacy/InviteShareCard";
import { OrderList } from "@/components/pharmacy/OrderList";
import { EODInventoryCheck } from "@/components/pharmacy/EODInventoryCheck";

export default function PharmacyOrdersPage() {
    const [orderFilter, setOrderFilter] = useState<'all' | 'patient' | 'pharmacy'>('all');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="w-5 h-5 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--primary)]">Store Operations</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Orders Dashboard</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Manage your active orders and fulfillment workflow
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <OrderFilters
                        activeFilter={orderFilter}
                        onFilterChange={setOrderFilter}
                    />
                    <Link href="/pharmacy/create-order">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Invite Card */}
            <InviteShareCard />

            {/* Orders Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[var(--text-main)] flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
                        Active Queue
                    </h2>
                    <span className="text-sm text-[var(--text-muted)]">Real-time Updates</span>
                </div>
                
                <OrderList filter={orderFilter} />
            </div>

            {/* EOD Section */}
            <div className="pt-6 border-t border-[var(--border)]">
                <EODInventoryCheck />
            </div>
        </motion.div>
    );
}
