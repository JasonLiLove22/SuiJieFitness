import { apiGet, apiPut } from './client';

export interface TrainingExercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  completed: boolean;
  sort_order: number;
}

export interface TrainingPlan {
  id: number;
  date: string;
  created_at: string;
}

export interface TrainingResponse {
  plan: TrainingPlan | null;
  exercises: TrainingExercise[];
}

export async function getPlan(date: string): Promise<TrainingResponse> {
  return apiGet(`/training?date=${date}`);
}

export async function savePlan(date: string, exercises: { name: string; sets: number; reps: number; completed: boolean }[]): Promise<TrainingResponse> {
  return apiPut(`/training/${date}`, { exercises });
}

export async function toggleExercise(date: string, exerciseId: number): Promise<{ id: number; completed: boolean }> {
  return apiPut(`/training/${date}/exercises/${exerciseId}/toggle`);
}
