"use client";

import { motion } from "framer-motion";
import { Plus, Boxes, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { InventoryAlertsCard } from "@/components/pharmacy/InventoryAlertsCard";
import { EODInventoryCheck } from "@/components/pharmacy/EODInventoryCheck";

export default function PharmacyHomePage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Dashboard</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Overview of your pharmacy operations
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/pharmacy/create-order">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/pharmacy/orders" className="block">
                    <Card className="border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text-main)]">View Orders</p>
                                    <p className="text-sm text-[var(--text-muted)]">Manage active and pending orders</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="border-[var(--border)]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                                <Boxes className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <div>
                                <Link href="/pharmacy/inventory" className="font-medium text-[var(--text-main)] hover:text-[var(--primary)] transition-colors">
                                    Manage Inventory
                                </Link>
                                <p className="text-sm text-[var(--text-muted)]">View and update stock levels</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Alerts */}
            <InventoryAlertsCard onViewInventory={() => window.location.href = '/pharmacy/inventory'} />

            {/* EOD Section */}
            <div className="pt-2">
                <EODInventoryCheck />
            </div>
        </motion.div>
    );
}
