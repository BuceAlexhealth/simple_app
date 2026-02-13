"use client";

import { useState, useMemo } from "react";
import { Search, MessageCircle, ArrowRight, Store, Pill, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { InventoryItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

// Dynamic imports for better code splitting
const VirtualizedMedicationList = dynamic(
    () => import("@/components/patient/VirtualizedMedicationList").then(mod => ({ default: mod.VirtualizedMedicationList })),
    {
        loading: () => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-5 h-32" />
                    </Card>
                ))}
            </div>
        ),
        ssr: false
    }
);

export default function PatientSearchPage() {
    const { medications, pharmacies, loading } = usePatientMedications();
    const [search, setSearch] = useState("");

    const filteredMedications = useMemo(() => {
        if (!search.trim()) return medications;
        return medications.filter((item: InventoryItem) =>
            item.name.toLowerCase().trim().includes(search.toLowerCase().trim())
        );
    }, [medications, search]);

    if (loading && medications.length === 0) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="loading-container">
                    <Loader2 className="loading-spinner" />
                    <p className="loading-text">Loading medications...</p>
                </div>
            </div>
        );
    }

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
                        <Pill className="w-5 h-5 text-[var(--text-light)]" />
                        <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Catalogue</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">Available Medications</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Browse medications from your connected pharmacies
                    </p>
                </div>
            </div>

            {/* Connected Pharmacies Widget */}
            {pharmacies.length > 0 && (
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[var(--primary-light)] rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div>
                                    <CardTitle>Your Pharmacists</CardTitle>
                                    <CardDescription>Connect with your healthcare providers</CardDescription>
                                </div>
                            </div>
                            <Link href="/patient/chats" className="text-sm text-[var(--primary)] hover:underline">
                                View All
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pharmacies.slice(0, 3).map((pharma) => (
                                <Link key={pharma.id} href={`/patient/chats?pharmacyId=${pharma.id}`}>
                                    <div className="group p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all cursor-pointer bg-[var(--card-bg)]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-[var(--text-inverse)] font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                                {pharma.full_name?.[0] || "P"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-[var(--text-main)] truncate">
                                                    {pharma.full_name || "Pharmacy"}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-xs text-[var(--text-muted)]">Available</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Section */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--primary-light)] rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <CardTitle>Find Medications</CardTitle>
                            <CardDescription>Search for specific products or browse all available medications</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
                        <Input
                            placeholder="Search products, medications..."
                            className="pl-12 h-12"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Medications List */}
            {medications.length === 0 && !loading ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
                            <Store className="w-8 h-8 text-[var(--primary)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
                            No connected pharmacies
                        </h3>
                        <p className="text-[var(--text-muted)] max-w-sm mb-6">
                            Connect with your local pharmacist to see medications available for purchase.
                        </p>
                        <Link href="/patient/pharmacies">
                            <Button>Browse Pharmacies</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <VirtualizedMedicationList
                    items={filteredMedications}
                    maxVisible={6}
                />
            )}

            {/* Mobile Floating Chat */}
            <Link href="/patient/chats" className="fab-mobile">
                <MessageCircle className="w-7 h-7" />
            </Link>
        </motion.div>
    );
}
