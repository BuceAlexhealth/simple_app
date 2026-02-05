"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: Record<string, string>;
}

interface ThemeContextType extends Theme {
  setThemeMode: (mode: ThemeMode) => void;
}

// Light theme colors - premium, professional palette
const lightColors: Record<string, string> = {
  // Backgrounds
  '--app-bg': '#FAFBFC',
  '--surface-bg': '#FFFFFF',
  '--card-bg': '#FFFFFF',
  '--overlay-bg': 'rgba(255, 255, 255, 0.95)',

  // Text colors - high contrast but not harsh
  '--text-main': '#1A1F36',
  '--text-muted': '#64748B',
  '--text-light': '#94A3B8',
  '--text-inverse': '#FFFFFF',

  // Primary colors - professional medical blue
  '--primary': '#2563EB',
  '--primary-dark': '#1D4ED8',
  '--primary-light': '#DBEAFE',
  '--primary-glow': 'rgba(37, 99, 235, 0.15)',

  // Accent colors
  '--success': '#059669',
  '--success-bg': '#ECFDF5',
  '--warning': '#D97706',
  '--warning-bg': '#FFFBEB',
  '--error': '#DC2626',
  '--error-bg': '#FEF2F2',
  '--info': '#0891B2',
  '--info-bg': '#F0F9FF',

  // Neutral colors
  '--border': '#E5E7EB',
  '--border-light': '#F3F4F6',
  '--border-subtle': '#F9FAFB',
  '--neutral': '#6B7280',
  '--neutral-bg': '#F9FAFB',

  // Shadow system - premium depth
  '--shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
  '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
  '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
  '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
  '--shadow-xl': '0 16px 64px rgba(0, 0, 0, 0.16)',
  '--shadow-primary': '0 4px 20px rgba(37, 99, 235, 0.15)',

  // Gradients
  '--gradient-primary': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  '--gradient-surface': 'linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%)',
  '--gradient-card': 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',

  // Special effects
  '--blur-sm': 'blur(8px)',
  '--blur-md': 'blur(16px)',
  '--blur-lg': 'blur(24px)',

  // Border radius - refined system
  '--radius-xs': '2px',
  '--radius-sm': '6px',
  '--radius-md': '10px',
  '--radius-lg': '14px',
  '--radius-xl': '20px',
  '--radius-full': '9999px',
};

// Dark theme colors - higher contrast, easy on eyes
const darkColors: Record<string, string> = {
  // Backgrounds - deep charcoal for higher contrast
  '--app-bg': '#0F0F14',
  '--surface-bg': '#1A1D29',
  '--card-bg': '#23262F',
  '--overlay-bg': 'rgba(15, 15, 20, 0.95)',

  // Text colors - pure whites for maximum readability
  '--text-main': '#FFFFFF',
  '--text-muted': '#A1A1AA',
  '--text-light': '#71717A',
  '--text-inverse': '#1A1F36',

  // Primary colors - brighter for dark mode
  '--primary': '#3B82F6',
  '--primary-dark': '#2563EB',
  '--primary-light': 'rgba(59, 130, 246, 0.15)',
  '--primary-glow': 'rgba(59, 130, 246, 0.25)',

  // Accent colors - dark mode optimized
  '--success': '#10B981',
  '--success-bg': 'rgba(16, 185, 129, 0.1)',
  '--warning': '#F59E0B',
  '--warning-bg': 'rgba(245, 158, 11, 0.1)',
  '--error': '#EF4444',
  '--error-bg': 'rgba(239, 68, 68, 0.1)',
  '--info': '#06B6D4',
  '--info-bg': 'rgba(6, 182, 212, 0.1)',

  // Neutral colors - dark mode specific
  '--border': '#2A2D3A',
  '--border-light': '#373A4A',
  '--border-subtle': '#1F222D',
  '--neutral': '#9CA3AF',
  '--neutral-bg': '#1A1D29',

  // Shadow system - adapted for dark
  '--shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.15)',
  '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.25)',
  '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.35)',
  '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.45)',
  '--shadow-xl': '0 16px 64px rgba(0, 0, 0, 0.55)',
  '--shadow-primary': '0 4px 20px rgba(59, 130, 246, 0.25)',

  // Gradients - dark mode optimized
  '--gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  '--gradient-surface': 'linear-gradient(135deg, #0F0F14 0%, #1A1D29 100%)',
  '--gradient-card': 'linear-gradient(135deg, #23262F 0%, #2A2D3A 100%)',

  // Special effects
  '--blur-sm': 'blur(8px)',
  '--blur-md': 'blur(16px)',
  '--blur-lg': 'blur(24px)',

  // Border radius - consistent with light
  '--radius-xs': '2px',
  '--radius-sm': '6px',
  '--radius-md': '10px',
  '--radius-lg': '14px',
  '--radius-xl': '20px',
  '--radius-full': '9999px',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage or default to system
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode | null;
      if (saved) return createTheme(saved);
      return createTheme('system');
    }
    return createTheme('system');
  });

  function createTheme(mode: ThemeMode): Theme {
    const resolvedMode = mode === 'system'
      ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    return {
      mode,
      resolvedMode,
      colors: resolvedMode === 'dark' ? darkColors : lightColors,
    };
  }

  function setThemeMode(mode: ThemeMode) {
    const newTheme = createTheme(mode);
    setThemeState(newTheme);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', mode);
    }
  }

  // Listen for system theme changes
  useEffect(() => {
    if (theme.mode === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = () => {
        setThemeState(createTheme('system'));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme.mode]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Apply all color variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      // Set theme attribute for CSS
      root.setAttribute('data-theme', theme.resolvedMode);
    }
  }, [theme.colors, theme.resolvedMode]);

  const contextValue = React.useMemo<ThemeContextType>(() => ({
    ...theme,
    setThemeMode,
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}