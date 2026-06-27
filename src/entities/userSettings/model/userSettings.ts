import type { AppDispatch, RootState } from '@/app/store/store';
import { userActions } from '@/entities/user/model/userSlice';
import { userApi } from '@/entities/user/api/userApi';

export type ViewSettingsData = {
  hideInactive: boolean;
  showDuration: boolean;
  hiddenGroups: string[];
};

export type UserServerSettings = {
  ringtone?: string;
  endCallSound?: boolean;
  groupOrder?: string[];
  viewSettings?: ViewSettingsData;
};

export function parseUserSettings(raw: string | undefined | null): UserServerSettings {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as UserServerSettings) : {};
  } catch {
    return {};
  }
}

export function saveUserSettings(patch: Partial<UserServerSettings>) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const userId = state.session.userId;
    if (!userId) return;

    const current = parseUserSettings(state.user.entities[userId]?.settings);
    const merged: UserServerSettings = { ...current, ...patch };
    const settingsStr = JSON.stringify(merged);

    dispatch(userActions.upsertOne({ id: userId, settings: settingsStr }));
    dispatch(userApi.endpoints.updateUserSettings.initiate({ userId, settings: settingsStr }));
  };
}