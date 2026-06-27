import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { saveUserSettings } from './userSettings';


export function useServerSettingsSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const groupOrder = useAppSelector((s) => s.groupOrder.order);
  const hideInactive = useAppSelector((s) => s.viewSettings.hideInactive);
  const showDuration = useAppSelector((s) => s.viewSettings.showDuration);
  const hiddenGroups = useAppSelector((s) => s.viewSettings.hiddenGroups);

  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const viewSettings = { hideInactive, showDuration, hiddenGroups };
    const payload = JSON.stringify({ groupOrder, viewSettings });

    if (lastSaved.current === null) {
      lastSaved.current = payload;
      return;
    }
    if (lastSaved.current === payload) return;
    lastSaved.current = payload;

    const t = setTimeout(() => {
      dispatch(saveUserSettings({ groupOrder, viewSettings }));
    }, 600);
    return () => clearTimeout(t);
  }, [userId, groupOrder, hideInactive, showDuration, hiddenGroups, dispatch]);
}