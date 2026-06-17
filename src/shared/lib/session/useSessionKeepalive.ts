import { useEffect } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { env } from '@/app/config/env';

const HOUR_MS = 60 * 60 * 1000;

export function useSessionKeepalive() {
  const userId = useAppSelector(selectUserId);

  useEffect(() => {
    if (!userId) return;

    const ping = () => {
      const body = JSON.stringify({
        method: 'User.Search',
        filter: { id: userId, limit: 1 },
      });
      fetch(env.API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body,
      }).catch(() => {  });
    };

    const timer = setInterval(ping, HOUR_MS);
    return () => clearInterval(timer);
  }, [userId]);
}