import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type BundleState = {
  items: unknown[];
  lastUpdatedAt: number | null;
};

const initialState: BundleState = {
  items: [],
  lastUpdatedAt: null,
};

export const bundleSlice = createSlice({
  name: "bundle",
  initialState,
  reducers: {
    snapshot: (state, action: PayloadAction<unknown[]>) => {
      state.items = action.payload;
      state.lastUpdatedAt = Date.now();
    },
    upsertMany: (state, action: PayloadAction<unknown[]>) => {
      state.items = action.payload;
      state.lastUpdatedAt = Date.now();
    },
    removeMany: (state, _action: PayloadAction<string[]>) => {
      state.lastUpdatedAt = Date.now();
    },
    clear: (state) => {
      state.items = [];
      state.lastUpdatedAt = null;
    },
  },
});

export const bundleActions = bundleSlice.actions;
export const bundleReducer = bundleSlice.reducer;