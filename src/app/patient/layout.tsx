"use client";

import { ReactNode } from "react";
import { ArrowLeft, User, Search, ShoppingCart, Store, MessageCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PatientLayout({ children }: { children: ReactNode }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // Use window.location.replace to clear any session state and redirect to login
        window.location.replace("/");
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
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold">Patient Portal</h1>
                            <p className="text-[10px] text-white/70">Health Services</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/patient" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Medication Search">
                        <Search className="w-5 h-5" />
                    </Link>
                    <Link href="/patient/pharmacies" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="My Pharmacies">
                        <Store className="w-5 h-5" />
                    </Link>
                    <Link href="/patient/chats" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Messages">
                        <MessageCircle className="w-5 h-5" />
                    </Link>
                    <Link href="/patient/orders" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="My Orders">
                        <ShoppingCart className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-white/80 hover:text-white"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="app-container p-6">
                {children}
            </main>
        </div>
    );
}
