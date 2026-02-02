"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { mode, setThemeMode, resolvedMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (mode === 'light') {
      setThemeMode('dark');
    } else if (mode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    if (mode === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (!mounted) return 'Loading...';
    if (mode === 'system') return 'System theme';
    return resolvedMode === 'dark' ? 'Dark mode' : 'Light mode';
  };

  if (!mounted) {
    return (
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-bg)] border border-[var(--border)] w-10 h-10 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative group p-3 rounded-[var(--radius-md)] bg-[var(--surface-bg)] border border-[var(--border)] hover:bg-[var(--border-light)] transition-all duration-200 hover:scale-105 active:scale-95 shadow-[var(--shadow-sm)]"
      title={getLabel()}
      aria-label={`Toggle theme. Current: ${getLabel()}`}
    >
      <div className="relative overflow-hidden">
        <div className="flex items-center justify-center transition-all duration-300 rotate-0 group-hover:rotate-180">
          {getIcon()}
        </div>
      </div>

      {/* Subtle indicator for system mode */}
      {mode === 'system' && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full opacity-60 animate-pulse" />
      )}

      <div className="absolute -inset-px rounded-[var(--radius-md)] bg-gradient-to-r from-transparent via-[var(--primary-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}