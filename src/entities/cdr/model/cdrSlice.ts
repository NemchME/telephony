import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CdrRecord = {
  id: string;
  bundleID?: string;
  createdTime?: number;
  answeredTime?: number;
  hangupTime?: number;
  direction?: "in" | "out" | "both";
  cdpn?: string;
  cgpn?: string;
};

export type CdrState = {
  entities: Record<string, CdrRecord>;
  ids: string[];
  total: number;
  offset: number;
};

const initialState: CdrState = {
  entities: {},
  ids: [],
  total: 0,
  offset: 0,
};

export const cdrSlice = createSlice({
  name: "cdr",
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<CdrRecord[]>) {
      for (const r of action.payload) {
        if (!state.entities[r.id]) state.ids.push(r.id);
        state.entities[r.id] = r;
      }
    },
    setPageInfo(state, action: PayloadAction<{ total: number; offset: number }>) {
      state.total = action.payload.total;
      state.offset = action.payload.offset;
    },
    reset() {
      return initialState;
    },
  },
});

export const cdrActions = cdrSlice.actions;

export const cdrReducer = cdrSlice.reducer;