import React, { useState } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { CategoryDTO, ExpenseFilters as FilterType } from '@expense-tracker/shared';
import { toCents } from '../utils';

interface ExpenseFiltersProps {
  categories: CategoryDTO[];
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
  onReset: () => void;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  categories,
  filters,
  onFilterChange,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [minDollars, setMinDollars] = useState(
    filters.minAmount !== undefined ? (filters.minAmount / 100).toString() : ''
  );
  const [maxDollars, setMaxDollars] = useState(
    filters.maxAmount !== undefined ? (filters.maxAmount / 100).toString() : ''
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput.trim() || undefined });
  };

  const handleMinAmountChange = (val: string) => {
    setMinDollars(val);
    const num = parseFloat(val);
    onFilterChange({
      minAmount: !isNaN(num) && num >= 0 ? toCents(num) : undefined,
    });
  };

  const handleMaxAmountChange = (val: string) => {
    setMaxDollars(val);
    const num = parseFloat(val);
    onFilterChange({
      maxAmount: !isNaN(num) && num >= 0 ? toCents(num) : undefined,
    });
  };

  const handleReset = () => {
    setSearchInput('');
    setMinDollars('');
    setMaxDollars('');
    onReset();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
      {/* Top Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search description or notes..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              showAdvanced || filters.categoryId || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <span>{showAdvanced ? 'Hide Filters' : 'Filters'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Inputs */}
      {showAdvanced && (
        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => onFilterChange({ categoryId: e.target.value || undefined })}
              className="w-full text-sm rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate ? filters.startDate.substring(0, 10) : ''}
              onChange={(e) =>
                onFilterChange({
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
              className="w-full text-sm rounded-lg border border-gray-300 py-1.5 px-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate ? filters.endDate.substring(0, 10) : ''}
              onChange={(e) =>
                onFilterChange({
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
              className="w-full text-sm rounded-lg border border-gray-300 py-1.5 px-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Amount Range Min/Max */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount Range ($)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                placeholder="Min"
                value={minDollars}
                onChange={(e) => handleMinAmountChange(e.target.value)}
                className="w-1/2 text-sm rounded-lg border border-gray-300 py-1.5 px-2 text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                step="0.01"
                placeholder="Max"
                value={maxDollars}
                onChange={(e) => handleMaxAmountChange(e.target.value)}
                className="w-1/2 text-sm rounded-lg border border-gray-300 py-1.5 px-2 text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
