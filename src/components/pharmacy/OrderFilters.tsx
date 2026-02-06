"use client";

interface OrderFiltersProps {
  activeFilter: 'all' | 'patient' | 'pharmacy';
  onFilterChange: (filter: 'all' | 'patient' | 'pharmacy') => void;
}

export function OrderFilters({ activeFilter, onFilterChange }: OrderFiltersProps) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'patient', label: 'Patient' },
    { id: 'pharmacy', label: 'Yours' },
  ] as const;

  return (
    <div className="flex items-center bg-[var(--surface-bg)] rounded-lg p-1 border border-[var(--border)]">
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
  );
}
