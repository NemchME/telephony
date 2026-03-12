import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type VertoCallDirection = 'outbound' | 'inbound';
export type VertoCallState = 'new' | 'trying' | 'ringing' | 'early' | 'active' | 'held' | 'hangup' | 'destroy';

export type VertoCallRecord = {
  callID: string;
  direction: VertoCallDirection;
  destinationNumber: string;
  callerIdName: string;
  callerIdNumber: string;
  state: VertoCallState;
  startedAt: number;
  answeredAt?: number;
  displayName?: string;
  displayNumber?: string;
  remoteSdp?: string;
};

export type VertoConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type VertoState = {
  connectionState: VertoConnectionState;
  calls: Record<string, VertoCallRecord>;
  callIds: string[];
};

const initialState: VertoState = {
  connectionState: 'disconnected',
  calls: {},
  callIds: [],
};

export const vertoSlice = createSlice({
  name: 'verto',
  initialState,
  reducers: {
    setConnectionState(state, action: PayloadAction<VertoConnectionState>) {
      state.connectionState = action.payload;
    },
    addCall(state, action: PayloadAction<VertoCallRecord>) {
      const c = action.payload;
      state.calls[c.callID] = c;
      if (!state.callIds.includes(c.callID)) {
        state.callIds.unshift(c.callID);
      }
    },
    updateCallState(state, action: PayloadAction<{ callID: string; state: VertoCallState }>) {
      const c = state.calls[action.payload.callID];
      if (c) {
        c.state = action.payload.state;
        if (action.payload.state === 'active' && !c.answeredAt) {
          c.answeredAt = Date.now();
        }
      }
    },
    updateCallDisplay(state, action: PayloadAction<{ callID: string; displayName: string; displayNumber: string }>) {
      const c = state.calls[action.payload.callID];
      if (c) {
        c.displayName = action.payload.displayName;
        c.displayNumber = action.payload.displayNumber;
      }
    },
    removeCall(state, action: PayloadAction<string>) {
      delete state.calls[action.payload];
      state.callIds = state.callIds.filter((id) => id !== action.payload);
    },
    clearAll() {
      return initialState;
    },
  },
});

export const vertoActions = vertoSlice.actions;
export const vertoReducer = vertoSlice.reducer;
