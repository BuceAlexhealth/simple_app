"use client";



interface OrderFiltersProps {
  activeFilter: 'all' | 'patient' | 'pharmacy';
  onFilterChange: (filter: 'all' | 'patient' | 'pharmacy') => void;
}

export function OrderFilters({ activeFilter, onFilterChange }: OrderFiltersProps) {
  return (
    <div className="flex items-center gap-2 bg-[var(--surface-bg)] rounded-[var(--radius-lg)] p-1 border border-[var(--border)]">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
          activeFilter === 'all' 
            ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)]' 
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
      >
        All Orders
      </button>
      <button
        onClick={() => onFilterChange('patient')}
        className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
          activeFilter === 'patient' 
            ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)]' 
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
      >
        Patient Orders
      </button>
      <button
        onClick={() => onFilterChange('pharmacy')}
        className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
          activeFilter === 'pharmacy' 
            ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-[var(--shadow-sm)]' 
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
      >
        Your Orders
      </button>
    </div>
  );
}