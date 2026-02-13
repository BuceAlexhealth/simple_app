"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, UserPlus, AlertCircle } from "lucide-react";

export default function InvitePage() {
    const { id } = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading");
    const [error, setError] = useState("");
    const [pharmacyName, setPharmacyName] = useState("");

    useEffect(() => {
        if (id) {
            handleInvite();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function handleInvite() {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch pharmacy name regardless of auth
        const { data: pharmacy } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", id)
            .single();

        if (pharmacy) setPharmacyName(pharmacy.full_name);

        if (!user) {
            setStatus("auth_required");
            return;
        }

        try {
            // 2. Create connection
            const { error: connError } = await supabase
                .from("connections")
                .upsert([{
                    patient_id: user.id,
                    pharmacy_id: id as string
                }], { onConflict: "patient_id, pharmacy_id" });

            if (connError) throw connError;

            setStatus("success");

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/patient");
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setStatus("error");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] p-6">
            <div className="bg-[var(--card-bg)] p-8 rounded-3xl shadow-xl w-full max-w-md border border-[var(--border)] text-center">
                {status === "loading" && (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto" />
                        <h1 className="text-xl font-bold text-[var(--text-main)]">Joining Pharmacy...</h1>
                        <p className="text-sm text-[var(--text-muted)]">Setting up your secure connection to {pharmacyName || "the pharmacy"}.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-main)]">Successfully Connected!</h1>
                        <p className="text-sm text-[var(--text-muted)]">You are now linked to <b>{pharmacyName}</b>. Redirecting to your dashboard...</p>
                    </div>
                )}

                {status === "auth_required" && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-indigo-50 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-main)]">Join {pharmacyName}</h1>
                        <p className="text-sm text-[var(--text-muted)]">Please sign in or create an account to connect with this pharmacy and browse their inventory.</p>
                        <button
                            onClick={() => router.push("/")}
                            className="btn-primary w-full"
                        >
                            Log In to Continue
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-main)]">Connection Failed</h1>
                        <p className="text-sm text-[var(--text-muted)]">{error}</p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-sm text-[var(--primary)] font-bold hover:underline"
                        >
                            Return Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
