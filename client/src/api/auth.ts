import { apiPost, apiGet, apiPut } from './client';

export interface User {
  id: number;
  username: string;
  name: string;
  height: number;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function register(data: {
  username: string;
  password: string;
  name: string;
  height: number;
  weight: number;
}): Promise<AuthResponse> {
  return apiPost('/auth/register', data);
}

export async function login(data: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  return apiPost('/auth/login', data);
}

export async function getMe(): Promise<{ user: User }> {
  return apiGet('/auth/me');
}

export async function updateMe(data: { name?: string; height?: number; weight?: number }): Promise<{ user: User }> {
  return apiPut('/auth/me', data);
}
