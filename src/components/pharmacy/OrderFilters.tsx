"use client";

import { useState, useEffect } from "react";
import { Search, X, Calendar } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface OrderFiltersProps {
  activeFilter: 'all' | 'patient' | 'pharmacy';
  onFilterChange: (filter: 'all' | 'patient' | 'pharmacy') => void;
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  dateFrom?: string;
  onDateFromChange: (date: string) => void;
  dateTo?: string;
  onDateToChange: (date: string) => void;
}

export function OrderFilters({ 
  activeFilter, 
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
}: OrderFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'patient', label: 'Patient' },
    { id: 'pharmacy', label: 'Yours' },
  ] as const;

  const hasActiveFilters = searchQuery || dateFrom || dateTo;

  const clearFilters = () => {
    setLocalSearch('');
    onSearchChange('');
    onDateFromChange('');
    onDateToChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search orders, items..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="pl-10 pr-3 py-2 bg-[var(--surface-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <span className="text-[var(--text-muted)]">-</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="pl-10 pr-3 py-2 bg-[var(--surface-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-bg)] rounded-lg transition-colors"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center bg-[var(--surface-bg)] rounded-lg p-1 border border-[var(--border)] w-fit">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeFilter === filter.id
                ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
