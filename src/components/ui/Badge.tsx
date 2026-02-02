import * as React from "react";
import { cn } from "./Button";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "primary" | "gradient";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "badge-primary",
        secondary: "bg-[var(--surface-bg)] text-[var(--text-main)] border border-[var(--border)] hover:bg-[var(--border-light)]",
        destructive: "badge-error",
        outline: "border border-[var(--border)] text-[var(--text-main)] bg-transparent hover:bg-[var(--surface-bg)]",
        success: "badge-success",
        warning: "badge-warning",
        primary: "badge-primary",
        gradient: "gradient-primary text-white border-none shadow-sm",
    };

    return (
        <div
            className={cn(
                "badge-premium",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
