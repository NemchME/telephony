import type { AppDispatch, RootState } from '@/app/store/store';
import { userActions } from '@/entities/user/model/userSlice';
import { sendUserUpdate } from '@/shared/api/ws/sendUserUpdate';

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

export function parseUserSettings(raw: unknown): UserServerSettings {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as UserServerSettings;
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return v && typeof v === 'object' ? (v as UserServerSettings) : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function saveUserSettings(patch: Partial<UserServerSettings>) {
  return (_dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const userId = state.session.userId;
    if (!userId) return;

    const current = parseUserSettings(state.user.entities[userId]?.settings);
    const merged: UserServerSettings = { ...current, ...patch };

    _dispatch(userActions.upsertOne({ id: userId, settings: merged }));

    sendUserUpdate(userId, { settings: merged });
  };
}