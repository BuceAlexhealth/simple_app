"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/components/ui/Button"; // Reusing cn from Button

interface SelectContextType {
    value: string;
    onChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}

export function Select({ value, onChange, children }: SelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
            const isOutsideContent = contentRef.current && !contentRef.current.contains(target);

            if (isOutsideContainer && isOutsideContent) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <SelectContext.Provider value={{ value, onChange, open, setOpen, triggerRef, contentRef }}>
            <div ref={containerRef} className="relative w-full">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

interface SelectTriggerProps {
    placeholder?: string;
    className?: string;
    children?: React.ReactNode;
}

export function SelectTrigger({ placeholder, className, children }: SelectTriggerProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");
    const { open, setOpen, value, triggerRef } = context;

    return (
        <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex items-center justify-between w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-transparent text-sm transition-all outline-none focus:ring-2 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] hover:border-[var(--primary)]",
                open && "border-[var(--primary)] ring-2 ring-[var(--primary-glow)]",
                className
            )}
        >
            <span className={cn("truncate font-medium", !value && "text-[var(--text-muted)]")}>
                {value || placeholder || "Select..."}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-[var(--text-muted)] transition-transform duration-200", open && "rotate-180")} />
        </button>
    );
}

interface SelectContentProps {
    children: React.ReactNode;
    className?: string;
}

export function SelectContent({ children, className }: SelectContentProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");
    const { open, triggerRef, contentRef } = context;
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open && triggerRef.current) {
            const updatePosition = () => {
                if (triggerRef.current) {
                    const rect = triggerRef.current.getBoundingClientRect();
                    setCoords({
                        top: rect.bottom + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            };

            updatePosition();
            // Optional: listen to scroll/resize to update position
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [open, triggerRef]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={contentRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                        position: 'absolute',
                        top: coords.top + 8,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className={cn(
                        "p-2 rounded-xl border border-[var(--border)] bg-white/95 backdrop-blur-xl shadow-2xl max-h-60 overflow-y-auto",
                        className
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

interface SelectItemProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");
    const { value: selectedValue, onChange, setOpen } = context;

    const isSelected = selectedValue === value;

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling causing issues
                onChange(value);
                setOpen(false);
            }}
            className={cn(
                "flex items-center w-full px-3 py-2.5 mb-1 last:mb-0 rounded-lg text-sm font-medium transition-colors text-left",
                isSelected
                    ? "bg-[var(--primary-light)] text-[var(--primary)] font-bold"
                    : "text-[var(--text-main)] hover:bg-[var(--surface-bg)]",
                className
            )}
        >
            <span className="flex-1 truncate">{children}</span>
            {isSelected && <Check className="w-4 h-4 ml-2 text-[var(--primary)]" />}
        </button>
    );
}
