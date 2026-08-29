import api from './api';
import { CategoryDTO, ApiResponse } from '@expense-tracker/shared';

export const categoryService = {
  async getCategories(): Promise<CategoryDTO[]> {
    const res = await api.get<ApiResponse<CategoryDTO[]>>('/categories');
    return res.data.data;
  },
};
