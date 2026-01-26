"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, UserPlus, CheckCircle2, Store, ArrowRight, Loader } from "lucide-react";

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [connections, setConnections] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch all pharmacists/pharmacies
        const { data: pharmaData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("role", ["pharmacist", "pharmacy"]);

        setPharmacies(pharmaData || []);

        if (user) {
            const { data: connData } = await supabase
                .from("connections")
                .select("pharmacy_id")
                .eq("patient_id", user.id);

            setConnections(connData?.map(c => c.pharmacy_id) || []);
        }
        setLoading(false);
    }

    async function toggleConnect(pharmacyId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Please sign in first");

        if (connections.includes(pharmacyId)) {
            await supabase.from("connections").delete().eq("patient_id", user.id).eq("pharmacy_id", pharmacyId);
            setConnections(prev => prev.filter(id => id !== pharmacyId));
        } else {
            await supabase.from("connections").insert([{ patient_id: user.id, pharmacy_id: pharmacyId }]);
            setConnections(prev => [...prev, pharmacyId]);
        }
    }

    const filteredPharmacies = pharmacies.filter(p =>
        (p.full_name || "Unknown Pharmacy").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Connected Pharmacies</h2>
                <p className="text-sm text-slate-500">Manage which pharmacies you can order from.</p>
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
                <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPharmacies.map((pharma) => {
                        const isConnected = connections.includes(pharma.id);
                        return (
                            <div key={pharma.id} className="app-card flex items-center justify-between p-6">
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
