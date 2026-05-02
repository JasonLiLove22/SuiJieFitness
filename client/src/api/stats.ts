import { apiGet } from './client';

export interface Stats {
  trainingDays: number;
  runCount: number;
  rideCount: number;
  totalCal: number;
}

export async function getStats(): Promise<Stats> {
  return apiGet('/stats');
}
