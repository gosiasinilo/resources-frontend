import { apiClient } from '../utils/api-client';
import type { AvailableTemp, Page, Temp, TempDetail } from './types';

export const getTemps = (page = 0, size = 100) =>
  apiClient.get<Page<Temp>>(`/temps?page=${page}&size=${size}`);

export const getTempById = (id: number) => apiClient.get<TempDetail>(`/temps/${id}`);

export const createTemp = (data: {
  firstName: string; lastName: string; email: string;
  city: string; notes?: string; skillIds?: number[];
}) => apiClient.post<Temp>('/temps', data);

export const editTemp = (id: number, data: Partial<{
  firstName: string; lastName: string; email: string; city: string; notes: string; skillIds: number[];
}>) => apiClient.patch<Temp>(`/temps/${id}`, data);

export const deleteTemp = (id: number) => apiClient.delete<void>(`/temps/${id}`);

export const getAvailableTempsForJob = (jobId: number) =>
  apiClient.get<AvailableTemp[]>(`/temps?jobId=${jobId}`);

export const getAvailableJobsForTemp = (startDate: string, endDate: string) =>
  apiClient.get<AvailableTemp[]>(`/temps?startDate=${startDate}&endDate=${endDate}`);
