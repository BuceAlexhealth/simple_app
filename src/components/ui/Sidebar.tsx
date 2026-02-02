"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/Button";
import { Menu, X, ChevronRight, LogOut, LucideIcon, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

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
    layoutIdPrefix: string;
}

const SidebarContent = ({ title, subtitle, logo, items, activeHref, onSignOut, layoutIdPrefix }: SidebarContentProps) => (
    <div className="flex flex-col h-full bg-[var(--card-bg)] shadow-2xl">
        {/* Header */}
        <div className="p-8 pb-6">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute -inset-2 gradient-primary opacity-20 blur-lg rounded-full animate-pulse"></div>
                    <div className="relative">
                        {logo}
                    </div>
                </div>
                <div>
                    <h1 className="font-black text-xl text-[var(--text-main)] tracking-tight leading-none mb-1 flex items-center gap-2">
                        {title}
                        <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                    </h1>
                    {subtitle && <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">{subtitle}</p>}
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
            {items.map((item) => {
                const isActive = activeHref === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="relative block group"
                    >
                        <div
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative z-10",
                                isActive
                                    ? "text-white"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-bg)]"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-[var(--text-light)] group-hover:text-[var(--primary)]"
                            )} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>

                            {isActive && (
                                <motion.div
                                    layoutId={`${layoutIdPrefix}-active-pill`}
                                    className="absolute inset-0 gradient-primary rounded-2xl -z-10 shadow-lg glow-primary"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-auto"
                                >
                                    <ChevronRight className="w-4 h-4 opacity-70" />
                                </motion.div>
                            )}
                        </div>
                    </Link>
                );
            })}
        </nav>

        {/* Footer */}
        <div className="p-6 m-4 mt-0 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4">
                <ThemeToggle />
                {onSignOut && (
                    <button
                        onClick={onSignOut}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 shadow-sm border border-slate-200 dark:border-slate-700 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
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
            <div className="md:hidden fixed top-0 left-0 right-0 h-[var(--header-height)] bg-[var(--app-bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    {logo}
                    <span className="font-black text-[var(--text-main)] text-sm tracking-tight uppercase tracking-[0.1em]">{title}</span>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-[var(--text-main)] active:scale-90 transition-all"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden md:block fixed top-0 left-0 h-screen w-72 bg-transparent z-30",
                className
            )}>
                <SidebarContent {...commonProps} layoutIdPrefix="desktop" />
            </aside>

            {/* Mobile Drawer Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Drawer */}
            <div className={cn(
                "md:hidden fixed top-0 left-0 w-[85%] max-w-[320px] h-screen bg-[var(--card-bg)] z-50 shadow-2xl transition-transform duration-500 ease-in-out transform border-r border-[var(--border)]",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent {...commonProps} layoutIdPrefix="mobile" />
            </div>
        </>
    );
}
