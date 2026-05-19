import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const LS_KEY = 'missedCalls.state';

export type MissedCallsState = {
  unseenCount: number;
  countedIds: string[];
};

function loadFromStorage(): MissedCallsState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { unseenCount: 0, countedIds: [] };
    const parsed = JSON.parse(raw) as Partial<MissedCallsState>;
    return {
      unseenCount: typeof parsed.unseenCount === 'number' ? parsed.unseenCount : 0,
      countedIds: Array.isArray(parsed.countedIds) ? parsed.countedIds.slice(-200) : [],
    };
  } catch {
    return { unseenCount: 0, countedIds: [] };
  }
}

function saveToStorage(state: MissedCallsState) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        unseenCount: state.unseenCount,
        countedIds: state.countedIds.slice(-200),
      }),
    );
  } catch {
    /* ignore */
  }
}

const initialState: MissedCallsState = loadFromStorage();

export const missedCallsSlice = createSlice({
  name: 'missedCalls',
  initialState,
  reducers: {
    incrementMissed(state, action: PayloadAction<{ id?: string }>) {
      const id = action.payload.id;
      if (id) {
        if (state.countedIds.includes(id)) return;
        state.countedIds.push(id);
        if (state.countedIds.length > 200) state.countedIds.shift();
      }
      state.unseenCount += 1;
      saveToStorage(state);
    },
    markSeen(state) {
      if (state.unseenCount !== 0) {
        state.unseenCount = 0;
        saveToStorage(state);
      }
    },
    reset(state) {
      state.unseenCount = 0;
      state.countedIds = [];
      saveToStorage(state);
    },
  },
});

export const missedCallsActions = missedCallsSlice.actions;
export const { incrementMissed, markSeen } = missedCallsSlice.actions;
export const missedCallsReducer = missedCallsSlice.reducer;