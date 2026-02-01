"use client";

import React from "react";

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard = React.memo(({ count = 1 }: SkeletonCardProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm animate-pulse">
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-lg bg-slate-100 h-6 w-20"></div>
            <div className="h-6 w-12 bg-slate-100 rounded"></div>
          </div>
          <div className="mb-4 h-6 bg-slate-100 rounded w-3/4"></div>
          <div className="mt-auto pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-slate-100 rounded"></div>
              <div className="h-4 w-12 bg-slate-100 rounded"></div>
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      ))}
    </>
  );
});

SkeletonCard.displayName = 'SkeletonCard';