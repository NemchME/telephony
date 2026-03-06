export type AuthResponse = {
  data?: {
    sessionID?: string;
    userName?: string;
    user?: { id: string; name: string; commonName?: string; domainID?: string };
    vertoUrl?: string;
  };
};