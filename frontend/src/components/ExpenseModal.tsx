import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Sparkles, RefreshCw } from 'lucide-react';
import { ExpenseDTO, CategoryDTO, PaymentMethod, RecurrenceFrequency } from '@expense-tracker/shared';
import { toCents } from '../utils';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { keywordMatcher } from '../utils/categorySuggester';

// ─── Swappable suggester instance ──────────────────────────────────────────
// To replace with ML: import { mlMatcher as categorySuggester } from '../utils/mlCategorySuggester';
const categorySuggester = keywordMatcher;
// ───────────────────────────────────────────────────────────────────────────

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
    isRecurring?: boolean;
    recurrenceFrequency?: RecurrenceFrequency;
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
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('MONTHLY');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Suggestion state: suggested categoryId and whether user has overridden it
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [suggestionLabel, setSuggestionLabel] = useState<string | null>(null);
  const [userOverrode, setUserOverrode] = useState<boolean>(false);

  // Debounce ref to avoid running matcher on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setDollars((expenseToEdit.amount / 100).toFixed(2));
      setDescription(expenseToEdit.description);
      setCategoryId(expenseToEdit.categoryId);
      setPaymentMethod(expenseToEdit.paymentMethod || 'CREDIT_CARD');
      setDate(expenseToEdit.date.substring(0, 10));
      setNotes(expenseToEdit.notes || '');
      setIsRecurring(expenseToEdit.isRecurring || false);
      setRecurrenceFrequency('MONTHLY');
    } else {
      setDollars('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setPaymentMethod('CREDIT_CARD');
      setDate(new Date().toISOString().substring(0, 10));
      setNotes('');
      setIsRecurring(false);
      setRecurrenceFrequency('MONTHLY');
    }
    setFormError(null);
    setSuggestedCategoryId(null);
    setSuggestionLabel(null);
    setUserOverrode(false);
  }, [expenseToEdit, categories, isOpen]);

  // Run keyword matcher 300ms after the user stops typing (only for new expenses)
  const handleDescriptionChange = (value: string) => {
    setDescription(value);

    if (expenseToEdit) return; // Don't auto-suggest when editing an existing expense

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const suggestion = categorySuggester.suggest(value);
      if (suggestion && !userOverrode) {
        // Find matching category from actual categories list (case-insensitive name match)
        const matched = categories.find(
          (c) => c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
        );
        if (matched) {
          setSuggestedCategoryId(matched.id);
          setSuggestionLabel(matched.name);
          setCategoryId(matched.id);
        }
      } else if (!suggestion) {
        setSuggestedCategoryId(null);
        setSuggestionLabel(null);
      }
    }, 300);
  };

  const handleCategoryChange = (newId: string) => {
    setCategoryId(newId);
    // User manually selected a different category — mark override so we stop auto-suggesting
    if (newId !== suggestedCategoryId) {
      setUserOverrode(true);
      setSuggestedCategoryId(null);
      setSuggestionLabel(null);
    }
  };

  const dismissSuggestion = () => {
    setUserOverrode(true);
    setSuggestedCategoryId(null);
    setSuggestionLabel(null);
  };

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
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
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

          {/* Description with debounced category suggestion */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g. Starbucks coffee, Uber home, Netflix"
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isSubmitting}
            />

            {/* Smart suggestion banner */}
            {suggestionLabel && !userOverrode && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  Suggested category:{' '}
                  <span className="font-semibold">{suggestionLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={dismissSuggestion}
                  className="ml-auto text-emerald-600 hover:text-emerald-800 text-xs underline underline-offset-2 focus:outline-none"
                  aria-label="Dismiss suggestion"
                >
                  Dismiss
                </button>
              </div>
            )}
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`block w-full rounded-lg border py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white ${
                    suggestedCategoryId && categoryId === suggestedCategoryId
                      ? 'border-emerald-400 ring-1 ring-emerald-400'
                      : 'border-gray-300'
                  }`}
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

          {/* Recurring Expense Options (Only for new expenses) */}
          {!expenseToEdit && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    Repeat this expense
                  </label>
                </div>
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-gray-200 animate-in fade-in duration-150">
                  <label htmlFor="recurrenceFrequency" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Frequency
                  </label>
                  <select
                    id="recurrenceFrequency"
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="WEEKLY">Weekly (every 7 days)</option>
                    <option value="MONTHLY">Monthly (same day of month, handles 31st safely)</option>
                    <option value="YEARLY">Yearly (same day & month, leap year safe)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Subsequent occurrences will be automatically tracked according to calendar rules.
                  </p>
                </div>
              )}
            </div>
          )}

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
