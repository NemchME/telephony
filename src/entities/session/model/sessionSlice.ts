import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type SessionUser = { 
    id: string; name: 
    string; commonName?: 
    string; domainID?: string
 };

type SessionState = {
  sessionID: string | null;
  userName: string | null;
  user: SessionUser | null;
  vertoUrl: string | null;
};

const initialState: SessionState = {
  sessionID: null,
  userName: null,
  user: null,
  vertoUrl: null,
};

const slice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<SessionState>) => action.payload,
    clearSession: () => initialState,
  },
});

export const { setSession, clearSession } = slice.actions;
export const sessionReducer = slice.reducer;