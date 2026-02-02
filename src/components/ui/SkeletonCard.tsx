import * as React from "react";

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-premium h-[240px] animate-pulse mb-4">
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 w-20 bg-[var(--border-light)] rounded-full"></div>
              <div className="h-6 w-16 bg-[var(--border-light)] rounded"></div>
            </div>
            <div className="h-8 w-full bg-[var(--border-light)] rounded"></div>
            <div className="space-y-2 pt-4">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-[var(--border-light)] rounded"></div>
                <div className="h-4 w-12 bg-[var(--border-light)] rounded"></div>
              </div>
              <div className="h-10 w-full bg-[var(--border-light)] rounded-xl mt-4"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

SkeletonCard.displayName = 'SkeletonCard';