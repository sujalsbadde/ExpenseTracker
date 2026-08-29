import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ExpenseDTO,
  CategoryDTO,
  ExpenseFilters,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseSummaryResponse,
  PaginatedData,
} from '@expense-tracker/shared';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { useAuth } from './AuthContext';

interface ExpenseContextType {
  expenses: ExpenseDTO[];
  categories: CategoryDTO[];
  pagination: PaginatedData<ExpenseDTO>['pagination'];
  filters: ExpenseFilters;
  summary: ExpenseSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

const defaultPagination: PaginatedData<ExpenseDTO>['pagination'] = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasMore: false,
};

const initialFilters: ExpenseFilters = {
  page: 1,
  limit: 10,
  sortBy: 'date',
  sortOrder: 'desc',
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [filters, setFiltersState] = useState<ExpenseFilters>(initialFilters);
  const [summary, setSummary] = useState<ExpenseSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load expense categories';
      setError(message);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await expenseService.getSummary(filters.startDate, filters.endDate);
      setSummary(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load expense metrics summary';
      setError(message);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchExpenses = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await expenseService.getExpenses(filters);
      setExpenses(data.items);
      setPagination(data.pagination);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch expenses';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
      fetchSummary();
    }
  }, [isAuthenticated, fetchExpenses, fetchSummary]);

  const createExpense = async (data: CreateExpenseRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await expenseService.createExpense(data);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create expense';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpense = async (id: string, data: UpdateExpenseRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await expenseService.updateExpense(id, data);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update expense';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await expenseService.deleteExpense(id);
      await Promise.all([fetchExpenses(), fetchSummary()]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete expense';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setFilters = (newFilters: Partial<ExpenseFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to page 1 when changing filters unless page specified
    }));
  };

  const resetFilters = () => {
    setFiltersState(initialFilters);
  };

  const setPage = (page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        categories,
        pagination,
        filters,
        summary,
        isLoading,
        error,
        fetchExpenses,
        fetchSummary,
        createExpense,
        updateExpense,
        deleteExpense,
        setFilters,
        resetFilters,
        setPage,
        clearError,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
