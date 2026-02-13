"use client";

import React, { useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface SuccessCelebrationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

export function SuccessCelebration({ show, message = "Success!", onComplete }: SuccessCelebrationProps) {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const confettiPositions = useMemo(() => 
    [...Array(12)].map((_, i) => ({
      left: 20 + (i * 15),
      top: 10 + (i * 5),
    })), 
  []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-[var(--success)] to-[#059669] rounded-full flex items-center justify-center shadow-[var(--shadow-lg)] success-bounce">
          <Check className="w-10 h-10 text-white" />
        </div>
        
        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 w-6 h-6 success-bounce" style={{ animationDelay: '0.2s' }}>
          <Sparkles className="w-full h-full text-[var(--warning)]" />
        </div>
        <div className="absolute -bottom-4 -left-2 w-5 h-5 success-bounce" style={{ animationDelay: '0.4s' }}>
          <Sparkles className="w-full h-full text-[var(--primary)]" />
        </div>
        <div className="absolute -top-4 -left-4 w-4 h-4 success-bounce" style={{ animationDelay: '0.6s' }}>
          <Sparkles className="w-full h-full text-[var(--accent)]" />
        </div>
        
        {/* Message */}
        <div className="mt-6 text-center">
          <div className="bg-[var(--success-bg)] border border-[var(--success)] rounded-[var(--radius-lg)] px-6 py-3 shadow-[var(--shadow-md)] success-pulse">
            <p className="text-[var(--success)] font-semibold text-premium-base">{message}</p>
          </div>
        </div>
        
        {/* Confetti effect (subtle) */}
        <div className="absolute inset-0 pointer-events-none">
          {confettiPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-[var(--primary)] to-[var(--success)] rounded-full opacity-60 success-bounce"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${0.1 + (i * 0.1)}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Floating action button with micro-interactions */
export function PremiumActionButton({
  onClick,
  children,
  icon: Icon,
  variant = 'primary',
  className = '',
  disabled = false,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        btn-premium 
        btn-ripple
        ${variant === 'secondary' ? 'btn-premium-secondary' : ''}
        ${variant === 'ghost' ? 'btn-premium-ghost' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}