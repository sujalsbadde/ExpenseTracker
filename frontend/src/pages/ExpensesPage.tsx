import React, { useState } from 'react';
import { Plus, TrendingUp, DollarSign, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { ExpenseDTO, CreateExpenseRequest, UpdateExpenseRequest } from '@expense-tracker/shared';
import { useExpenses } from '../context/ExpenseContext';
import { Layout } from '../components/Layout';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseFilters } from '../components/ExpenseFilters';
import { ExpenseModal } from '../components/ExpenseModal';
import { RecurringRulesModal } from '../components/RecurringRulesModal';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils';

export const ExpensesPage: React.FC = () => {
  const {
    expenses,
    categories,
    pagination,
    filters,
    summary,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    setFilters,
    resetFilters,
    setPage,
    clearError,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseDTO | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: ExpenseDTO) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    if (expenseToEdit) {
      await updateExpense(expenseToEdit.id, data as UpdateExpenseRequest);
    } else {
      await createExpense(data as CreateExpenseRequest);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete);
      setExpenseToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Expenses Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track, organize, and filter your daily expenditures
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsRecurringModalOpen(true)}
              className="inline-flex items-center justify-center px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-300 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-emerald-600" />
              <span>Recurring Series</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {error && <ErrorMessage message={error} onDismiss={clearError} />}

        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {summary ? formatCurrency(summary.totalSpent) : '$0.00'}
              </h3>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expense Count</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{pagination.total}</h3>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Category</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[150px]">
                {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0
                  ? summary.categoryBreakdown.reduce((max, cat) => (cat.totalAmount > max.totalAmount ? cat : max)).categoryName
                  : 'None'}
              </h3>
            </div>
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Multi-Criteria Filters Bar */}
        <ExpenseFilters
          categories={categories}
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
        />

        {/* Expense Listing & Pagination */}
        <ExpenseList
          expenses={expenses}
          pagination={pagination}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onDelete={(id) => setExpenseToDelete(id)}
          onPageChange={setPage}
        />

        {/* Add/Edit Expense Modal */}
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          expenseToEdit={expenseToEdit}
          categories={categories}
        />

        {/* Manage Recurring Rules Modal */}
        <RecurringRulesModal
          isOpen={isRecurringModalOpen}
          onClose={() => setIsRecurringModalOpen(false)}
          categories={categories}
          onRulesChanged={() => {
            // Re-fetch current expenses in case rules were triggered or stopped
            setPage(pagination.page);
          }}
        />

        {/* Delete Confirmation Dialog */}
        {expenseToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in fade-in zoom-in duration-150">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Expense?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this expense record? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
