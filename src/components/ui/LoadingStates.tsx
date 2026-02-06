"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CSS_CLASSES } from "@/config/constants";

// Base skeleton component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(CSS_CLASSES.SKELETON.BASE, className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(CSS_CLASSES.SKELETON.CARD, className)}
      {...props}
    />
  );
}

// Text skeleton with customizable width
interface TextSkeletonProps extends SkeletonProps {
  width?: string;
  lines?: number;
}

export function TextSkeleton({ width = "100%", lines = 1, className, ...props }: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(CSS_CLASSES.SKELETON.TEXT, className)}
          style={{ width: i === lines - 1 ? width : "100%" }}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function AvatarSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(CSS_CLASSES.SKELETON.AVATAR, className)}
      {...props}
    />
  );
}

// Order card skeleton
export function OrderCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border)]", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-16" />
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

// Medication card skeleton
export function MedicationCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("h-full bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5 flex flex-col", className)} {...props}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

// Chat skeleton
export function ChatSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex gap-3 p-4", className)} {...props}>
      <AvatarSkeleton />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Message skeleton
export function MessageSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-2 p-4", className)} {...props}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Table skeleton
interface TableSkeletonProps extends SkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 3, className, ...props }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List skeleton with multiple items
interface ListSkeletonProps extends SkeletonProps {
  count?: number;
  itemHeight?: string;
}

export function ListSkeleton({ count = 3, itemHeight = "h-20", className, ...props }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border)]">
          <div className={cn("flex items-center gap-4", itemHeight)}>
            <AvatarSkeleton />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic skeleton grid for cards
interface SkeletonGridProps extends SkeletonProps {
  count?: number;
  columns?: number;
  skeletonType?: 'card' | 'medication' | 'order';
}

export function SkeletonGrid({ 
  count = 6, 
  columns = 3, 
  skeletonType = 'card',
  className,
  ...props 
}: SkeletonGridProps) {
  const SkeletonComponent = {
    card: CardSkeleton,
    medication: MedicationCardSkeleton,
    order: OrderCardSkeleton,
  }[skeletonType];

  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message = "Loading...", children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--text-muted)] font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', message, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin", sizeClasses[size])}></div>
      {message && (
        <span className="text-[var(--text-muted)]">{message}</span>
      )}
    </div>
  );
}

// Export all skeleton components
export const Skeletons = {
  Skeleton,
  Card: CardSkeleton,
  Text: TextSkeleton,
  Avatar: AvatarSkeleton,
  Order: OrderCardSkeleton,
  Medication: MedicationCardSkeleton,
  Chat: ChatSkeleton,
  Message: MessageSkeleton,
  Table: TableSkeleton,
  List: ListSkeleton,
  Grid: SkeletonGrid,
  LoadingOverlay,
  LoadingSpinner,
} as const;