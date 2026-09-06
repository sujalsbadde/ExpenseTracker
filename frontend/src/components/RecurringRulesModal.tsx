import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Pause, Play, Trash2, Calendar, Tag } from 'lucide-react';
import { RecurringRuleDTO, CategoryDTO } from '@expense-tracker/shared';
import { recurrenceService } from '../services/recurrenceService';
import { formatCurrency } from '../utils';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface RecurringRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
  onRulesChanged?: () => void;
}

export const RecurringRulesModal: React.FC<RecurringRulesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onRulesChanged,
}) => {
  const [rules, setRules] = useState<RecurringRuleDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recurrenceService.getRules();
      setRules(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recurring series');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleActive = async (rule: RecurringRuleDTO) => {
    setActionLoadingId(rule.id);
    try {
      await recurrenceService.updateRule(rule.id, { isActive: !rule.isActive });
      await fetchRules();
      onRulesChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update rule status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Stop this recurring series? Past generated expenses will be kept.')) return;
    setActionLoadingId(ruleId);
    try {
      await recurrenceService.deleteRule(ruleId);
      await fetchRules();
      onRulesChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop recurring series');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'General';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            <h3 id="recurring-modal-title" className="text-lg font-bold text-gray-900">
              Recurring Expense Series
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">No recurring series set up</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                When adding an expense, check "Repeat this expense" to automatically track subscriptions, rent, and recurring bills.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {rules.map((rule) => {
                const isWorking = actionLoadingId === rule.id;
                const nextDate = new Date(rule.nextDueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-sm">{rule.description}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rule.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                        <span className="inline-flex items-center text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {rule.frequency}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-3 gap-y-1">
                        <span className="flex items-center">
                          <Tag className="w-3 h-3 mr-1 text-gray-400" />
                          {getCategoryName(rule.categoryId)}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          Next due: <strong className="ml-1 text-gray-700">{nextDate}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <span className="text-base font-black text-gray-900">
                        {formatCurrency(rule.amount)}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          disabled={isWorking}
                          title={rule.isActive ? 'Pause recurring series' : 'Resume recurring series'}
                          className={`p-1.5 rounded-lg border text-xs font-medium inline-flex items-center transition-colors ${
                            rule.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {rule.isActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                          {rule.isActive ? 'Pause' : 'Resume'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={isWorking}
                          title="Stop/Delete recurring series"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete recurring rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
