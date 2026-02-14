"use client";

import { motion } from "framer-motion";
import { LucideIcon, Loader2 } from "lucide-react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-6xl mx-auto space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface PageHeaderProps {
  icon?: LucideIcon;
  label?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ icon: Icon, label, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {(Icon || label) && (
          <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className="w-5 h-5 text-[var(--primary)]" />}
            {label && <span className="text-sm font-medium text-[var(--primary)]">{label}</span>}
          </div>
        )}
        <h1 className="text-3xl font-bold text-[var(--text-main)]">{title}</h1>
        {subtitle && <p className="text-[var(--text-muted)] mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ icon: Icon, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-[var(--primary)]" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  searchTerm,
  onClearSearch 
}: EmptyStateProps) {
  return (
    <div className="border-dashed border-2 border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
        {searchTerm ? "No matches found" : title}
      </h3>
      <p className="text-[var(--text-muted)] max-w-sm mb-6">
        {searchTerm 
          ? `No results matching "${searchTerm}". Try a different search term.` 
          : description
        }
      </p>
      {searchTerm && onClearSearch ? (
        <button 
          onClick={onClearSearch}
          className="text-[var(--primary)] hover:underline font-medium"
        >
          Clear Search
        </button>
      ) : (
        action
      )}
    </div>
  );
}
