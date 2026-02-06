"use client";

import { ReactNode } from "react";
import { ArrowLeft, User, Search, ShoppingCart, Store, MessageCircle, LogOut, Package, Settings } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sidebar } from "@/components/ui/Sidebar";
import { useRouter } from "next/navigation";

export default function PatientLayout({ children }: { children: ReactNode }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navItems = [
        { label: "Search Meds", href: "/patient", icon: Search },
        { label: "My Cart", href: "/patient/cart", icon: ShoppingCart },
        { label: "My Orders", href: "/patient/orders", icon: Package },
        { label: "Pharmacies", href: "/patient/pharmacies", icon: Store },
        { label: "Messages", href: "/patient/chats", icon: MessageCircle },
        { label: "Settings", href: "/patient/settings", icon: Settings },
    ];

    return (
        <div className="bg-[var(--app-bg)] min-h-screen">
            <Sidebar
                title="Patient Portal"
                subtitle="Health Services"
                logo={<User className="w-5 h-5 text-white" />}
                items={navItems}
                onSignOut={handleSignOut}
            />

            <main className="md:ml-72 transition-all pt-[var(--header-height)] md:pt-0 min-h-screen">
                <div className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
