import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SessionUser = {
  id: string;
  name: string;
  commonName?: string;
  numbers?: string[];
  adminStatus?: number;
  availStatus?: string;
  dod?: string;
};

export type SessionState = {
  sessionID: string | null;
  userName: string | null;
  userId: string | null;
  userCommonName: string | null;
  userNumbers: string[];
  availStatus: string | null;
  vertoUrl: string | null;
  user: SessionUser | null;
};

const initialState: SessionState = {
  sessionID: null,
  userName: null,
  userId: null,
  userCommonName: null,
  userNumbers: [],
  availStatus: null,
  vertoUrl: null,
  user: null,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(
      _state,
      action: PayloadAction<{
        sessionID: string;
        userName: string;
        userId?: string;
        userCommonName?: string;
        userNumbers?: string[];
        availStatus?: string;
        vertoUrl?: string | null;
        user?: SessionUser | null;
      }>,
    ) {
      const p = action.payload;
      return {
        sessionID: p.sessionID,
        userName: p.userName,
        userId: p.userId ?? null,
        userCommonName: p.userCommonName ?? null,
        userNumbers: p.userNumbers ?? [],
        availStatus: p.availStatus ?? null,
        vertoUrl: p.vertoUrl ?? null,
        user: p.user ?? null,
      };
    },
    setAvailStatus(state, action: PayloadAction<string>) {
      state.availStatus = action.payload;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const sessionActions = sessionSlice.actions;
export const { setSession, clearSession, setAvailStatus } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
