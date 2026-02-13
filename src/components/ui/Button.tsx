"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CSS_CLASSES } from "@/config/constants";

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

        const baseStyles = "btn-premium";

        const variants = {
            default: "",
            destructive: "btn-premium-destructive",
            outline: "btn-premium-secondary",
            secondary: "btn-premium-secondary",
            ghost: "btn-premium-ghost",
            link: "text-[var(--primary)] underline-offset-4 hover:underline font-medium bg-transparent hover:bg-transparent p-0 h-auto min-w-0 shadow-none border-none",
            gradient: "",
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
                    variants[variant],
                    size === 'default' ? '' : sizes[size],
                    className
                )}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button };
