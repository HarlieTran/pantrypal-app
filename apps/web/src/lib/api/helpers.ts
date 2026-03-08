export function buildUrl(base: string, path: string, params?: Record<string, string | undefined>): string {
  const url = `${base}${path}`;
  if (!params) return url;
  
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join('&');
  
  return query ? `${url}?${query}` : url;
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8788';
}
