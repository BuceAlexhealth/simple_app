"use client";

import { ChevronLeft, MoreVertical, Circle } from "lucide-react";

interface ChatHeaderProps {
  selectedConnection: any;
  role: 'patient' | 'pharmacy';
  isMobile: boolean;
  onBackClick: () => void;
}

export function ChatHeader({
  selectedConnection,
  role,
  isMobile,
  onBackClick
}: ChatHeaderProps) {
  const badgeText = role === 'patient' ? "Verified Pharmacist" : "Online";

  return (
    <div className="h-16 border-b border-[var(--border)] bg-[var(--card-bg)] sticky top-0 z-20 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onBackClick}
            className="p-1.5 -ml-2 rounded-lg hover:bg-[var(--surface-bg)] text-[var(--text-muted)] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
          {selectedConnection.full_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-main)] text-sm leading-tight">
            {selectedConnection.full_name}
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-[var(--success)] font-medium">
            <Circle className="w-2 h-2 fill-current" />
            {badgeText}
          </span>
        </div>
      </div>
      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-bg)] rounded-lg transition-colors">
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}
