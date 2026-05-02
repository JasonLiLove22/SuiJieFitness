import { apiGet } from './client';
import type { RunningRecord } from './running';

export interface ExerciseEntry {
  name: string;
  sets: number;
  reps: number;
  completed: boolean;
}

export interface DailyRecord {
  date: string;
  hasTraining: boolean;
  trainingCompleted: boolean;
  exerciseCount: number;
  completedCount: number;
  exercises: ExerciseEntry[];
  runs: RunningRecord[];
  totalDistance: number;
  totalCalories: number;
}

export async function getHistory(year: number, month: number): Promise<{ days: DailyRecord[] }> {
  return apiGet(`/history?year=${year}&month=${month}`);
}
