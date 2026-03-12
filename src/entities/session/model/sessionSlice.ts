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

export type WsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type SessionState = {
  sessionID: string | null;
  userName: string | null;
  userId: string | null;
  userCommonName: string | null;
  userNumbers: string[];
  availStatus: string | null;
  vertoUrl: string | null;
  user: SessionUser | null;
  wsStatus: WsConnectionStatus;
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
  wsStatus: 'disconnected',
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
        wsStatus: 'disconnected' as const,
      };
    },
    setAvailStatus(state, action: PayloadAction<string>) {
      state.availStatus = action.payload;
    },
    setWsStatus(state, action: PayloadAction<WsConnectionStatus>) {
      state.wsStatus = action.payload;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const sessionActions = sessionSlice.actions;
export const { setSession, clearSession, setAvailStatus, setWsStatus } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
