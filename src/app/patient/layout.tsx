"use client";

import { ReactNode } from "react";
import { ArrowLeft, User, Search, ShoppingCart, Store, MessageCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PatientLayout({ children }: { children: ReactNode }) {
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
                    <Link href="/patient/chats" className="relative p-2.5 bg-white/20 hover:bg-white/30 rounded-full transition-all shadow-lg ring-1 ring-white/20" title="Messages">
                        <MessageCircle className="w-5 h-5 text-white hover:scale-110 transition-transform" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-900"></span>
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

            <main className="app-container p-6 pb-20 md:pb-6">
                {children}
            </main>

            {/* Mobile Bottom Navigation - Only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
                <div className="flex justify-around items-center py-2">
                    <Link href="/patient" className="mobile-nav-item" title="Medication Search">
                        <Search className="w-5 h-5" />
                        <span className="text-xs">Search</span>
                    </Link>
                    <Link href="/patient/pharmacies" className="mobile-nav-item" title="My Pharmacies">
                        <Store className="w-5 h-5" />
                        <span className="text-xs">Pharmacies</span>
                    </Link>
                    <Link href="/patient/chats" className="mobile-nav-item relative" title="Messages">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs">Messages</span>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                    </Link>
                    <Link href="/patient/orders" className="mobile-nav-item" title="My Orders">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-xs">Orders</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="mobile-nav-item text-slate-600 hover:text-rose-500"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-xs">Logout</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
