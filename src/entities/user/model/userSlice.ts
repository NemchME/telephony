import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type User = {
  id: string;
  name?: string;
  commonName?: string;
  adminStatus?: number;
  availStatus?: string;
  busyStatus?: string;
  numbers?: string[];
  manageTags?: string[];
  authorized?: number;
  domainID?: string;
  maxCalls?: number;
  settings?: string;
  lastModifiedTime?: number;
  lastModifiedAvailStatus?: number;
};

export type UserStateRecord = {
  id: string;
  userID?: string;
  networkStatus?: number;
  busyCount?: number;
  lastModified?: number;
  lastModifiedAvailStatus?: number;
  lastModifiedBusyCount?: number;
  lastModifiedNetworkStatus?: number;
};

export type UserSliceState = {
  entities: Record<string, User>;
  ids: string[];
  states: Record<string, UserStateRecord>;
};

const initialState: UserSliceState = {
  entities: {},
  ids: [],
  states: {},
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<User[]>) {
      for (const u of action.payload) {
        if (!state.entities[u.id]) state.ids.push(u.id);
        state.entities[u.id] = u;
      }
    },
    upsertOne(state, action: PayloadAction<User>) {
      const u = action.payload;
      const existing = state.entities[u.id];
      if (!existing) state.ids.push(u.id);
      state.entities[u.id] = existing ? { ...existing, ...u } : u;
    },
    setUserStates(state, action: PayloadAction<UserStateRecord[]>) {
      state.states = {};
      for (const s of action.payload) {
        const key = s.userID ?? s.id;
        state.states[key] = s;
      }
    },
    upsertUserState(state, action: PayloadAction<UserStateRecord>) {
      const s = action.payload;
      const key = s.userID ?? s.id;
      const existing = state.states[key];
      state.states[key] = existing ? { ...existing, ...s } : s;
    },
    reset() {
      return initialState;
    },
  },
});

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;
