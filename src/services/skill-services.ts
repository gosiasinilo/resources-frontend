import { apiClient } from '../pages/utils/api-client';
import type { Skill } from '../pages/types';

export const getSkills = () => apiClient.get<Skill[]>('/skills');
export const createSkill = (name: string) => apiClient.post<Skill>('/skills', { name });
export const deleteSkill = (id: number) => apiClient.delete<void>(`/skills/${id}`);
