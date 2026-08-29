import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, CreditCard, FileText } from 'lucide-react';
import { ExpenseDTO, CategoryDTO, PaymentMethod } from '@expense-tracker/shared';
import { toCents } from '../utils';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    description: string;
    categoryId: string;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
  }) => Promise<void>;
  expenseToEdit?: ExpenseDTO | null;
  categories: CategoryDTO[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  categories,
}) => {
  const [dollars, setDollars] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (expenseToEdit) {
      setDollars((expenseToEdit.amount / 100).toFixed(2));
      setDescription(expenseToEdit.description);
      setCategoryId(expenseToEdit.categoryId);
      setPaymentMethod(expenseToEdit.paymentMethod || 'CREDIT_CARD');
      setDate(expenseToEdit.date.substring(0, 10));
      setNotes(expenseToEdit.notes || '');
    } else {
      setDollars('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setPaymentMethod('CREDIT_CARD');
      setDate(new Date().toISOString().substring(0, 10));
      setNotes('');
    }
    setFormError(null);
  }, [expenseToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedDollars = parseFloat(dollars);
    if (isNaN(parsedDollars) || parsedDollars <= 0) {
      setFormError('Please enter a valid amount greater than $0.00');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter a description for the expense');
      return;
    }

    if (!categoryId) {
      setFormError('Please select a category');
      return;
    }

    const amountInCents = toCents(parsedDollars);

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: amountInCents,
        description: description.trim(),
        categoryId,
        paymentMethod,
        date: new Date(date).toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 id="modal-title" className="text-lg font-bold text-gray-900">
            {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {formError && <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />}

          {/* Amount input in dollars */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount ($ USD) *
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                id="amount"
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
                placeholder="0.00"
                className="pl-10 block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Stored safely as integer cents in database.</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Trader Joe's Groceries"
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category & Payment Method row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  required
                  disabled={isSubmitting}
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                disabled={isSubmitting}
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any extra details or receipt references..."
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
