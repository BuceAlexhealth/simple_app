"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { OrderFilters } from "@/components/pharmacy/OrderFilters";
import { InviteShareCard } from "@/components/pharmacy/InviteShareCard";
import { OrderList } from "@/components/pharmacy/OrderList";
import { EODInventoryCheck } from "@/components/pharmacy/EODInventoryCheck";

export default function PharmacyOrdersPage() {
    const [orderFilter, setOrderFilter] = useState<'all' | 'patient' | 'pharmacy'>('all');

    return (
        <div className="space-y-10 pb-20 fade-in">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-[var(--text-main)] tracking-tight">
                        Store <span className="text-[var(--primary)]">Operations</span>
                    </h2>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                        Manage your active orders and fulfillment workflow.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="glass-card p-1.5 rounded-2xl flex items-center gap-2 border-[var(--border)]">
                        <OrderFilters
                            activeFilter={orderFilter}
                            onFilterChange={setOrderFilter}
                        />
                    </div>
                    <Link href="/pharmacy/create-order" className="w-full sm:w-auto">
                        <Button variant="default" className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg glow-primary scale-in">
                            <Plus className="w-4 h-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Actions / Stats Area */}
            <div className="grid grid-cols-1 gap-8 slide-up">
                <InviteShareCard />

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Active Queue</h3>
                        <div className="h-0.5 flex-1 mx-6 bg-[var(--border-light)] hidden md:block"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Real-time Updates</span>
                    </div>
                    <OrderList filter={orderFilter} />
                </div>

                <div className="pt-8 border-t border-[var(--border)] border-dashed">
                    <EODInventoryCheck />
                </div>
            </div>
        </div>
    );
}

