import { ApiError } from './types';
import { getApiBaseUrl } from './helpers';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const url = `${getApiBaseUrl()}${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed with status ${response.status}`,
      errorData
    );
  }

  return response.json();
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', token });
}

export async function apiPost<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body, token });
}

export async function apiPut<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'PUT', body, token });
}

export async function apiPatch<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'PATCH', body, token });
}

export async function apiDelete<T>(endpoint: string, token?: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE', token, body });
}
