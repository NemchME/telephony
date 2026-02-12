import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type User = {
  id: string;
  name: string;
  commonName?: string;
  adminStatus?: 0 | 1;
  availStatus?: "avail" | "direct" | "dnd" | "away" | string;
  numbers?: string[];
  authorized?: 0 | 1;
  domainID?: string;
};

export type UserState = {
  entities: Record<string, User>;
  ids: string[];
};

const initialState: UserState = {
  entities: {},
  ids: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<User[]>) {
      for (const u of action.payload) {
        if (!state.entities[u.id]) state.ids.push(u.id);
        state.entities[u.id] = u;
      }
    },
    reset() {
      return initialState;
    },
  },
});

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;