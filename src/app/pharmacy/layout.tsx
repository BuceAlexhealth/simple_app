"use client";

import { ReactNode } from "react";
import { Store, ClipboardList, Package, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";

export default function PharmacyLayout({ children }: { children: ReactNode }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navItems = [
        { label: "Orders", href: "/pharmacy", icon: ClipboardList },
        { label: "Inventory", href: "/pharmacy/inventory", icon: Package },
        { label: "Chats", href: "/pharmacy/chats", icon: MessageCircle },
    ];

    return (
        <div className="bg-[var(--app-bg)] min-h-screen">
            <Sidebar
                title="Pharmacy Manager"
                subtitle="Admin Dashboard"
                logo={
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-lg flex items-center justify-center shadow-md">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                }
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
