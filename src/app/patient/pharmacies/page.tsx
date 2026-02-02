"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, UserPlus, CheckCircle2, Store, ArrowRight, Loader } from "lucide-react";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [connections, setConnections] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { profiles: profRepo, connections: connRepo } = createRepositories(supabase);

        // Fetch all pharmacists/pharmacies
        const pharmaData = await handleAsyncError(
            () => profRepo.getProfilesByRole(["pharmacist", "pharmacy"]),
            "Failed to load pharmacies"
        );

        if (pharmaData) {
            setPharmacies(pharmaData || []);
        }

        if (user) {
            const connData = await handleAsyncError(
                () => connRepo.getConnectedPharmacies(user.id),
                "Failed to load connections"
            );

            if (connData) {
                setConnections(connData.map((c: any) => c.pharmacy_id));
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function toggleConnect(pharmacyId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in first");
            return;
        }

        const { connections: connRepo } = createRepositories(supabase);

        if (connections.includes(pharmacyId)) {
            const success = await handleAsyncError(
                () => connRepo.deleteConnection(user.id, pharmacyId),
                "Failed to disconnect"
            );
            if (success) {
                setConnections(prev => prev.filter(id => id !== pharmacyId));
                toast.success("Disconnected from pharmacy");
            }
        } else {
            const success = await handleAsyncError(
                () => connRepo.createConnection(user.id, pharmacyId),
                "Failed to connect"
            );
            if (success) {
                setConnections(prev => [...prev, pharmacyId]);
                toast.success("Connected to pharmacy");
            }
        }
    }

    const filteredPharmacies = pharmacies.filter(p =>
        (p.full_name || "Unknown Pharmacy").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Connected <span className="text-[var(--primary)]">Pharmacies</span></h2>
                    <p className="text-sm font-medium text-[var(--text-muted)]">Manage which pharmacies you can order from.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search for a pharmacy by name..."
                    className="input-field pl-12 h-14"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading-container">
                    <Loader className="loading-spinner" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPharmacies.map((pharma) => {
                        const isConnected = connections.includes(pharma.id);
                        return (
                            <div key={pharma.id} className="card-style flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{pharma.full_name || "Pharma Store"}</h3>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Active Pharmacist</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleConnect(pharma.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isConnected
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : 'bg-indigo-50 text-[var(--primary)] border border-indigo-100 hover:bg-indigo-100'
                                        }`}
                                >
                                    {isConnected ? <><CheckCircle2 className="w-4 h-4" /> Connected</> : <><Plus className="w-4 h-4" /> Connect</>}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
