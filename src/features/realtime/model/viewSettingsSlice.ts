import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store/store';

const LS_KEY = 'viewSettings.v1';

export type ViewSettings = {
  hideInactive: boolean;
  showDuration: boolean;
  hiddenGroups: string[];
};

const defaults: ViewSettings = {
  hideInactive: false,
  showDuration: true,
  hiddenGroups: [],
};

function load(): ViewSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ViewSettings>;
    return {
      hideInactive: typeof parsed.hideInactive === 'boolean' ? parsed.hideInactive : defaults.hideInactive,
      showDuration: typeof parsed.showDuration === 'boolean' ? parsed.showDuration : defaults.showDuration,
      hiddenGroups: Array.isArray(parsed.hiddenGroups) ? parsed.hiddenGroups.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    return defaults;
  }
}

function save(s: ViewSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

const slice = createSlice({
  name: 'viewSettings',
  initialState: load(),
  reducers: {
    toggleHideInactive(state) {
      state.hideInactive = !state.hideInactive;
      save(state);
    },
    toggleShowDuration(state) {
      state.showDuration = !state.showDuration;
      save(state);
    },
    toggleGroupVisibility(state, action: PayloadAction<string>) {
      const gid = action.payload;
      const idx = state.hiddenGroups.indexOf(gid);
      if (idx >= 0) {
        state.hiddenGroups.splice(idx, 1);
      } else {
        state.hiddenGroups.push(gid);
      }
      save(state);
    },
    showAllGroups(state) {
      state.hiddenGroups = [];
      save(state);
    },
  },
});

export const viewSettingsReducer = slice.reducer;
export const viewSettingsActions = slice.actions;

export const selectHideInactive = (s: RootState) => s.viewSettings.hideInactive;
export const selectShowDuration = (s: RootState) => s.viewSettings.showDuration;
export const selectHiddenGroups = (s: RootState) => s.viewSettings.hiddenGroups;
