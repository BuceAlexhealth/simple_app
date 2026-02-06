"use client";

import { ReactNode } from "react";
import { Store, ClipboardList, Package, MessageCircle, Settings } from "lucide-react";
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
        { label: "Settings", href: "/pharmacy/settings", icon: Settings },
    ];

    return (
        <div className="bg-[var(--app-bg)] min-h-screen">
            <Sidebar
                title="Pharmacy Manager"
                subtitle="Admin Dashboard"
                logo={<Store className="w-5 h-5 text-white" />}
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
