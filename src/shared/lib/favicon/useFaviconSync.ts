import { useEffect } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectAvailStatus } from '@/entities/session/model/sessionSelectors';
import { setFaviconForStatus } from './favicon';

export function useFaviconSync() {
  const status = useAppSelector(selectAvailStatus);
  const wsStatus = useAppSelector((s) => s.session.wsStatus);

  useEffect(() => {
    const offline = wsStatus !== 'connected';
    setFaviconForStatus(status, { offline });
  }, [status, wsStatus]);
}