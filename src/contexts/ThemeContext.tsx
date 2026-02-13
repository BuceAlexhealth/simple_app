"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

function getSystemTheme(): ResolvedThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedThemeMode {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode | null;
      const initialMode = saved || 'system';
      setMode(initialMode);
      setResolvedMode(resolveTheme(initialMode));
      setMounted(true);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set data-theme attribute for CSS selector
      root.setAttribute('data-theme', resolvedMode);
      
      // Set class for tailwind dark mode (if needed)
      if (resolvedMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [resolvedMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setResolvedMode(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    setResolvedMode(resolveTheme(newMode));
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode = resolvedMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  }, [resolvedMode, setThemeMode]);

  // Always provide context value (even during SSR/hydration)
  const contextValue = useMemo<ThemeContextType>(() => ({
    mode,
    resolvedMode,
    setThemeMode,
    toggleTheme,
  }), [mode, resolvedMode, setThemeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
