import api from './api';
import {
  RecurringRuleDTO,
  CreateRecurringRuleRequest,
  UpdateRecurringRuleRequest,
  ApiResponse,
} from '@expense-tracker/shared';

export const recurrenceService = {
  async getRules(): Promise<RecurringRuleDTO[]> {
    const res = await api.get<ApiResponse<RecurringRuleDTO[]>>('/recurring');
    return res.data.data;
  },

  async createRule(data: CreateRecurringRuleRequest): Promise<{ rule: RecurringRuleDTO; initialExpense: any }> {
    const res = await api.post<ApiResponse<{ rule: RecurringRuleDTO; initialExpense: any }>>('/recurring', data);
    return res.data.data;
  },

  async getRuleById(id: string): Promise<RecurringRuleDTO> {
    const res = await api.get<ApiResponse<RecurringRuleDTO>>(`/recurring/${id}`);
    return res.data.data;
  },

  async updateRule(id: string, data: UpdateRecurringRuleRequest): Promise<RecurringRuleDTO> {
    const res = await api.put<ApiResponse<RecurringRuleDTO>>(`/recurring/${id}`, data);
    return res.data.data;
  },

  async deleteRule(id: string): Promise<void> {
    await api.delete(`/recurring/${id}`);
  },

  async processDue(): Promise<{ generatedCount: number; expenses: any[] }> {
    const res = await api.post<ApiResponse<{ generatedCount: number; expenses: any[] }>>('/recurring/process');
    return res.data.data;
  },
};
