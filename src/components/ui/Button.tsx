"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
    size?: "default" | "sm" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium btn-premium btn-ripple transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-light)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:transform-none relative overflow-hidden";

        const variants = {
            default: "",
            destructive: "bg-[var(--error)] hover:bg-[var(--error)] text-white",
            outline: "btn-premium-secondary",
            secondary: "btn-premium-secondary",
            ghost: "btn-premium-ghost",
            link: "text-[var(--primary)] underline-offset-4 hover:underline font-medium bg-transparent hover:bg-transparent p-0 h-auto min-w-0 shadow-none border-none",
            gradient: "gradient-animated text-white shadow-lg hover:shadow-xl glow-primary",
        };

        const sizes = {
            default: "",
            sm: "text-xs px-3 py-2 min-h-9",
            lg: "text-base px-6 py-3 min-h-12",
            icon: "p-2 min-h-10 min-w-10",
        };

        return (
            <Comp
                className={cn(
                    baseStyles,
                    variant === 'default' ? '' : variants[variant],
                    size === 'default' ? '' : sizes[size],
                    className
                )}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 spinner-premium" />}
                {children}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button };
