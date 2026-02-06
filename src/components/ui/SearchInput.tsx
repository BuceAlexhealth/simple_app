"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "",
  showClear = true
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
      <Input
        placeholder={placeholder}
        className="pl-12 h-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {showClear && value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => onChange("")}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

interface SectionSearchProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
}

export function SectionSearch({ value, onChange, title, placeholder }: SectionSearchProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-main)]">{title}</h2>
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
