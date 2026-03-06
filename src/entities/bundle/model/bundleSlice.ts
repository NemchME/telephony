import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type BundleService = {
  id: string;
  type: string;
  createdTime?: number;
  hangupTime?: string | number;
  answeredTime?: string | number;
  ringingTime?: string | number;
  connState?: string;
  callState?: number;
  cgpn?: string;
  cgpnm?: string;
  cdpn?: string;
  cdpnm?: string;
  'caller.commonName'?: string;
  'caller.commonNumber'?: string;
  'caller.userID'?: string;
  'caller.userName'?: string;
  'callee.commonName'?: string;
  'callee.commonNumber'?: string;
  'callee.userID'?: string;
  'callee.userName'?: string;
  [k: string]: unknown;
};

export type Bundle = {
  id: string;
  domainID?: string;
  services: BundleService[];
};

export type BundleSliceState = {
  entities: Record<string, Bundle>;
  ids: string[];
};

const initialState: BundleSliceState = {
  entities: {},
  ids: [],
};

export const bundleSlice = createSlice({
  name: 'bundle',
  initialState,
  reducers: {
    setAll(state, action: PayloadAction<Bundle[]>) {
      state.entities = {};
      state.ids = [];
      for (const b of action.payload) {
        state.entities[b.id] = b;
        state.ids.push(b.id);
      }
    },
    upsertBundle(state, action: PayloadAction<Bundle>) {
      const b = action.payload;
      if (!state.entities[b.id]) state.ids.push(b.id);
      state.entities[b.id] = b;
    },
    removeBundle(state, action: PayloadAction<string>) {
      const id = action.payload;
      delete state.entities[id];
      state.ids = state.ids.filter((x) => x !== id);
    },
    clear() {
      return initialState;
    },
  },
});

export const bundleActions = bundleSlice.actions;
export const bundleReducer = bundleSlice.reducer;
