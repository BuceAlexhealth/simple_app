"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface StatItem {
  label: string;
  value: string | number;
  color?: "default" | "success" | "warning" | "error";
  active?: boolean;
  onClick?: () => void;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

const colorClasses = {
  default: "text-[var(--text-main)]",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]", 
  error: "text-[var(--error)]"
};

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`${stat.onClick ? "cursor-pointer hover:border-[var(--primary)] transition-colors" : ""} ${stat.active ? "border-[var(--primary)] ring-1 ring-[var(--primary)]" : ""}`}
        >
          <CardContent 
            className="p-4" 
            onClick={stat.onClick}
          >
            <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            <p className={`text-2xl font-bold ${colorClasses[stat.color || "default"]}`}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "default" | "success" | "warning" | "error";
}

export function StatsCard({ label, value, icon: Icon, color = "default" }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="w-10 h-10 bg-[var(--surface-bg)] rounded-lg flex items-center justify-center text-[var(--primary)]">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
