"use client";

import { ReactNode } from "react";
import { ArrowLeft, Search, Store, ClipboardList, Package, LogOut, MessageCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PharmacyLayout({ children }: { children: ReactNode }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <div className="bg-[var(--app-bg)] min-h-screen">
            <header className="app-header">
                <div className="flex items-center gap-4">
                    <Link href="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold">Pharmacy Manager</h1>
                            <p className="text-[10px] text-white/70">Admin Dashboard</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSignOut} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-white/80 hover:text-white">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <nav className="flex bg-white border-b border-[var(--border)] sticky top-[var(--header-height)] z-40">
                <Link href="/pharmacy" className="flex-1 py-4 text-center border-b-2 border-transparent hover:text-[var(--primary)] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-500">
                    <ClipboardList className="w-4 h-4" />
                    <span>Orders</span>
                </Link>
                <Link href="/pharmacy/inventory" className="flex-1 py-4 text-center border-b-2 border-transparent hover:text-[var(--primary)] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-500">
                    <Package className="w-4 h-4" />
                    <span>Inventory</span>
                </Link>
                <Link href="/pharmacy/chats" className="flex-1 py-4 text-center border-b-2 border-transparent hover:text-[var(--primary)] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-500">
                    <MessageCircle className="w-4 h-4" />
                    <span>Chats</span>
                </Link>
            </nav>

            <main className="max-w-[1600px] mx-auto p-4 md:p-6 pb-24">
                {children}
            </main>
        </div>
    );
}
