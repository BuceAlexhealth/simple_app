"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface SidebarItem {
    icon: LucideIcon;
    label: string;
    href: string;
}

interface SidebarProps {
    title: string;
    subtitle?: string;
    logo?: React.ReactNode;
    items: SidebarItem[];
    onSignOut?: () => void;
    className?: string;
}

interface SidebarContentProps {
    title: string;
    subtitle?: string;
    logo?: React.ReactNode;
    items: SidebarItem[];
    activeHref: string | undefined;
    onSignOut?: () => void;
}

const SidebarContent = ({ title, subtitle, logo, items, activeHref, onSignOut }: SidebarContentProps) => (
    <div className="flex flex-col h-full bg-[var(--card-bg)]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center text-white shadow-lg">
                        {logo}
                    </div>
                </div>
                <div className="min-w-0">
                    <h1 className="font-semibold text-lg text-[var(--text-main)] leading-tight truncate">
                        {title}
                    </h1>
                    {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {items.map((item) => {
                const isActive = activeHref === item.href;
                const Icon = item.icon;
                
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="block"
                    >
                        <motion.div
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-[var(--primary)] text-white shadow-md"
                                    : "text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-main)]"
                            )}
                            whileHover={{ x: isActive ? 0 : 2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0",
                                isActive ? "text-white" : "text-[var(--text-muted)]"
                            )} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                        </motion.div>
                    </Link>
                );
            })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
                <ThemeToggle />
                {onSignOut && (
                    <button
                        onClick={onSignOut}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    </div>
);

export function Sidebar({ title, subtitle, logo, items, onSignOut, className }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    // Determine active item based on longest matching path
    const activeHref = items
        .filter(item => pathname === item.href || pathname?.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    const commonProps = { title, subtitle, logo, items, activeHref, onSignOut };

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-lg flex items-center justify-center text-white">
                        {logo}
                    </div>
                    <span className="font-semibold text-[var(--text-main)] text-sm">{title}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-9 w-9 rounded-lg"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
            </div>

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden md:block fixed top-0 left-0 h-screen w-72 bg-transparent z-30",
                className
            )}>
                <SidebarContent {...commonProps} />
            </aside>

            {/* Mobile Drawer Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Drawer */}
            <motion.div
                initial={false}
                animate={{ x: isOpen ? 0 : "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="md:hidden fixed top-0 left-0 w-[85%] max-w-[320px] h-screen bg-[var(--card-bg)] z-50 shadow-2xl border-r border-[var(--border)]"
            >
                <SidebarContent {...commonProps} />
            </motion.div>
        </>
    );
}
