"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { usePharmacies } from "@/hooks/usePharmacies";
import { supabase } from "@/lib/supabase";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";

// Reusable components
import {
  PageContainer,
  PageHeader,
  SearchInput,
  GridList
} from "@/components";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface Pharmacy {
  id: string;
  full_name: string;
  role: string;
}

export default function PharmaciesPage() {
    const { user } = useUser();
    const { pharmacies, connectedIds, loading, refetch } = usePharmacies();
    const [search, setSearch] = useState("");
    const [localConnectedIds, setLocalConnectedIds] = useState<string[]>([]);

    // Use local state for immediate UI updates, fall back to fetched data
    const effectiveConnectedIds = localConnectedIds.length > 0 ? localConnectedIds : connectedIds;

    async function toggleConnect(pharmacyId: string) {
        if (!user) {
            toast.error("Please sign in first");
            return;
        }

        const { connections: connRepo } = createRepositories(supabase);

        if (effectiveConnectedIds.includes(pharmacyId)) {
            const success = await handleAsyncError(
                () => connRepo.deleteConnection(user.id, pharmacyId),
                "Failed to disconnect"
            );
            if (success) {
                setLocalConnectedIds(prev => prev.filter(id => id !== pharmacyId));
                toast.success("Disconnected from pharmacy");
                refetch();
            }
        } else {
            const success = await handleAsyncError(
                () => connRepo.createConnection(user.id, pharmacyId),
                "Failed to connect"
            );
            if (success) {
                setLocalConnectedIds(prev => [...prev, pharmacyId]);
                toast.success("Connected to pharmacy");
                refetch();
            }
        }
    }

    const filteredPharmacies = pharmacies.filter((p: Pharmacy) =>
        (p.full_name || "Unknown Pharmacy").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                icon={Store}
                label="Pharmacies"
                title="Connected Pharmacies"
                subtitle="Manage which pharmacies you can order from"
            />

            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search pharmacies by name..."
            />

            {!loading && (
                <GridList
                    items={filteredPharmacies}
                    keyExtractor={(p: Pharmacy) => p.id}
                    columns={2}
                    renderItem={(pharma: Pharmacy) => {
                        const isConnected = effectiveConnectedIds.includes(pharma.id);
                        return (
                            <Card>
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-bg)] rounded-xl flex items-center justify-center text-[var(--primary)]">
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[var(--text-main)]">
                                                {pharma.full_name || "Pharma Store"}
                                            </h3>
                                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                                                Active Pharmacist
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        variant={isConnected ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => toggleConnect(pharma.id)}
                                        className={isConnected ? "border-emerald-500 text-emerald-600" : ""}
                                    >
                                        {isConnected ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                Connected
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-1.5" />
                                                Connect
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    }}
                />
            )}

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-5 h-20" />
                        </Card>
                    ))}
                </div>
            )}

            {filteredPharmacies.length === 0 && !loading && (
                <div className="border-dashed border-2 border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
                        <Store className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
                        No pharmacies found
                    </h3>
                    <p className="text-[var(--text-muted)]">
                        Try a different search term
                    </p>
                </div>
            )}
        </PageContainer>
    );
}
