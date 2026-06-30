import { wsClient } from './wsClient';
import { env } from '@/app/config/env';

export function sendUserUpdate(userId: string, data: Record<string, unknown>): void {
  const payload = {
    method: 'User.Update',
    filter: { id: userId },
    data,
  };

  if (wsClient.send(payload)) return;

  fetch(env.API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  }).catch(() => { /* некритично */ });
}