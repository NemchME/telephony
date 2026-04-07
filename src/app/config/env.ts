export const env = {
  API_URL: import.meta.env.VITE_API_URL as string ?? '/api',
  WS_URL: import.meta.env.VITE_WS_URL as string ?? '/ws',
  VERTO_URL: import.meta.env.VITE_VERTO_URL as string ?? '',
} as const;
