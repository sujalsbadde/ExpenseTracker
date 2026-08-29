import api from './api';
import {
  ExpenseDTO,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  PaginatedData,
  ExpenseSummaryResponse,
  ApiResponse,
} from '@expense-tracker/shared';

export const expenseService = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<PaginatedData<ExpenseDTO>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const res = await api.get<ApiResponse<PaginatedData<ExpenseDTO>>>(`/expenses?${params.toString()}`);
    return res.data.data;
  },

  async getExpenseById(id: string): Promise<ExpenseDTO> {
    const res = await api.get<ApiResponse<ExpenseDTO>>(`/expenses/${id}`);
    return res.data.data;
  },

  async createExpense(data: CreateExpenseRequest): Promise<ExpenseDTO> {
    const res = await api.post<ApiResponse<ExpenseDTO>>('/expenses', data);
    return res.data.data;
  },

  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<ExpenseDTO> {
    const res = await api.put<ApiResponse<ExpenseDTO>>(`/expenses/${id}`, data);
    return res.data.data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async getSummary(startDate?: string, endDate?: string): Promise<ExpenseSummaryResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await api.get<ApiResponse<ExpenseSummaryResponse>>(`/expenses/summary?${params.toString()}`);
    return res.data.data;
  },
};
