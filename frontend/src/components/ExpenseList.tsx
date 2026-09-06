import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Inbox, CreditCard, Tag, Calendar, RefreshCw } from 'lucide-react';
import { ExpenseDTO, PaginatedData } from '@expense-tracker/shared';
import { formatCurrency } from '../utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ExpenseListProps {
  expenses: ExpenseDTO[];
  pagination: PaginatedData<ExpenseDTO>['pagination'];
  isLoading: boolean;
  onEdit: (expense: ExpenseDTO) => void;
  onDelete: (expenseId: string) => void;
  onPageChange: (page: number) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  pagination,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
        <LoadingSpinner message="Loading your expenses..." />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No expenses found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          No expenses match your current filters. Try changing your filters or add a new expense.
        </p>
      </div>
    );
  }

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/75">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Expense
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                {/* Description & Notes */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">{exp.description}</span>
                    {exp.isRecurring && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"
                        title="Recurring series entry"
                      >
                        <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin-reverse" />
                        Recurring
                      </span>
                    )}
                  </div>
                  {exp.notes && <div className="text-xs text-gray-500 truncate max-w-xs">{exp.notes}</div>}
                </td>

                {/* Category Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    style={
                      exp.category?.color
                        ? { backgroundColor: `${exp.category.color}18`, color: exp.category.color }
                        : undefined
                    }
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {exp.category?.name || 'General'}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(exp.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                {/* Payment Method */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    <CreditCard className="w-3 h-3 mr-1 text-gray-400" />
                    {exp.paymentMethod.replace('_', ' ')}
                  </span>
                </td>

                {/* Amount in Dollars */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                  {formatCurrency(exp.amount)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(exp)}
                    className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded hover:bg-emerald-50"
                    aria-label={`Edit ${exp.description}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(exp.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                    aria-label={`Delete ${exp.description}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-gray-100">
        {expenses.map((exp) => (
          <div key={exp.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{exp.description}</h4>
                  {exp.isRecurring && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                      Recurring
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(exp.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{exp.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-gray-900">{formatCurrency(exp.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                style={
                  exp.category?.color
                    ? { backgroundColor: `${exp.category.color}18`, color: exp.category.color }
                    : undefined
                }
              >
                {exp.category?.name || 'General'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(exp)}
                  className="p-1 text-gray-500 hover:text-emerald-600 rounded"
                  aria-label="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(exp.id)}
                  className="p-1 text-gray-500 hover:text-red-600 rounded"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div>
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{pagination.total}</span> expenses
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <span className="text-xs font-medium text-gray-700 px-2">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
