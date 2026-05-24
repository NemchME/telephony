import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';

export function useMissedCallsTitleSync() {
  const missedCount = useAppSelector((s) => s.missedCalls.unseenCount);
  const originalTitleRef = useRef<string>(document.title);

  useEffect(() => {
    const stripped = document.title.replace(/^\(\d+\)\s*/, '');
    originalTitleRef.current = stripped || 'telephony';
  }, []);

  useEffect(() => {
    const base = originalTitleRef.current;
    document.title = missedCount > 0 ? `(${missedCount}) ${base}` : base;
  }, [missedCount]);
}
