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
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Active Orders</h2>
                    <p className="text-slate-500">Track and fulfill prescriptions from your patients.</p>
                </div>
                <div className="flex items-center gap-3">
                    <OrderFilters 
                        activeFilter={orderFilter} 
                        onFilterChange={setOrderFilter} 
                    />
                    <Link href="/pharmacy/create-order">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Order
                        </Button>
                    </Link>
                </div>
            </div>

            <InviteShareCard />
            <OrderList filter={orderFilter} />
            <EODInventoryCheck />
        </div>
    );
}

