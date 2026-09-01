import { apiClient } from '../utils/api-client';
import type { AvailableTemp, Job, JobType, Page } from './types';

interface GetJobsOpts {
  status?: string;
  overdue?: boolean;
  jobType?: string;
  sort?: string;
}

export const getJobs = (page = 0, size = 10, opts: GetJobsOpts = {}) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (opts.status)   p.append('status',  opts.status);
  if (opts.overdue)  p.append('overdue', 'true');
  if (opts.jobType)  p.append('jobType', opts.jobType);
  if (opts.sort)     p.append('sort',    opts.sort);
  return apiClient.get<Page<Job>>(`/jobs?${p}`);
};

export const getJobById = (id: number) => apiClient.get<Job>(`/jobs/${id}`);

export const createJob = (data: {
  name: string; description?: string; jobType: JobType;
  startDate: string; endDate: string; city?: string; requiredSkillIds?: number[];
}) => apiClient.post<Job>('/jobs', data);

export const editJob = (id: number, data: Partial<{
  name: string; description: string; jobType: JobType;
  startDate: string; endDate: string; city: string; requiredSkillIds: number[];
}>) => apiClient.patch<Job>(`/jobs/${id}`, data);

export const assignTemp = (jobId: number, tempId: number) =>
  apiClient.patch<Job>(`/jobs/${jobId}/assign?tempId=${tempId}`);

export const unassignTemp = (jobId: number) =>
  apiClient.patch<Job>(`/jobs/${jobId}/unassign`);

export const completeJob = (jobId: number, review: {
  workQuality: number; communication: number; onTime: number; comments?: string;
}) => apiClient.post<Job>(`/jobs/${jobId}/complete`, review);

export const closeJob = (id: number) => apiClient.post<Job>(`/jobs/${id}/close`, {});

export const deleteJob = (id: number) => apiClient.delete<void>(`/jobs/${id}`);

export const recommendTemp = (jobId: number) =>
  apiClient.post<{ tempId: number; firstName: string; lastName: string; reasoning: string }>(
    `/jobs/${jobId}/recommend-temp`, {}
  );

export const getAvailableTemps = (jobId: number) =>
  apiClient.get<AvailableTemp[]>(`/temps?jobId=${jobId}`);

export const getAvailableJobsForTemp = (tempId: number) =>
  apiClient.get<AvailableTemp[]>(`/temps?jobId=${tempId}`);
