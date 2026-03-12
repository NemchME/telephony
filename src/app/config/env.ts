function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`ENV variable ${name} is required`);
  return value;
}

const isDev = import.meta.env.DEV;

export const env = {
  API_URL: isDev ? '/api' : requireEnv('VITE_API_URL'),
  WS_URL: isDev ? '/ws' : requireEnv('VITE_WS_URL'),
    VERTO_URL: isDev ? '/verto' : requireEnv("VITE_VERTO_URL"),
} as const;
