import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type FiltersState = {
  cdr: Record<string, unknown>;
};

const initialState: FiltersState = {
  cdr: {},
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCdrFilters: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.cdr = action.payload;
    },
    resetCdrFilters: (state) => {
      state.cdr = {};
    },
  },
});

export const { setCdrFilters, resetCdrFilters } = filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;