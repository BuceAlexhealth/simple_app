"use client";



interface OrderFiltersProps {
  activeFilter: 'all' | 'patient' | 'pharmacy';
  onFilterChange: (filter: 'all' | 'patient' | 'pharmacy') => void;
}

export function OrderFilters({ activeFilter, onFilterChange }: OrderFiltersProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'all' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        All Orders
      </button>
      <button
        onClick={() => onFilterChange('patient')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'patient' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Patient Orders
      </button>
      <button
        onClick={() => onFilterChange('pharmacy')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeFilter === 'pharmacy' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Your Orders
      </button>
    </div>
  );
}