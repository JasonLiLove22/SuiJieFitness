import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { SplitPace } from '../utils/gps';

export interface RunningRecord {
  id: number;
  user_id: number;
  date: string;
  distance: number;
  minutes: number;
  pace: number;
  calories: number;
  splits: SplitPace[];
  hidden: boolean;
  type: string;
  created_at: string;
}

export interface AllRecordsResponse {
  runs: RunningRecord[];
  totalDistance: number;
  totalCalories: number;
}

export async function getRuns(date: string, type?: string): Promise<{ runs: RunningRecord[] }> {
  const params = new URLSearchParams({ date });
  if (type) params.set('type', type);
  return apiGet(`/running?${params}`);
}

export async function getAllRuns(type: string): Promise<AllRecordsResponse> {
  return apiGet(`/running?all=true&type=${type}`);
}

export async function addRun(data: {
  date: string;
  distance: number;
  minutes: number;
  splits?: SplitPace[];
  type?: string;
}): Promise<RunningRecord> {
  return apiPost('/running', data);
}

export async function hideRun(id: number): Promise<{ id: number; hidden: boolean }> {
  return apiPut(`/running/${id}/hide`);
}

export async function deleteRun(id: number): Promise<{ success: boolean }> {
  return apiDelete(`/running/${id}`);
}
