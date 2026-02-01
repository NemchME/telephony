function requireEnv(name: string): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`ENV variable ${name} is required`);
  }

  return value;
}

export const env = {
  API_URL: requireEnv("VITE_API_URL"),
  WS_URL: requireEnv("VITE_WS_URL"),
} as const;