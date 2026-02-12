 import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store/store';

const LS_KEY = 'groupOrder.v1';

const load = (): string[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const save = (order: string[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(order)); } catch {}
};

type State = { order: string[] };
const initialState: State = { order: load() };

const slice = createSlice({
  name: 'groupOrder',
  initialState,
  reducers: {
    setGroupOrder(state, a: PayloadAction<string[]>) {
      state.order = a.payload;
      save(state.order);
    },
    moveGroup(state, a: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = a.payload;
      const next = state.order.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      state.order = next;
      save(state.order);
    },
    ensureContains(state, a: PayloadAction<string[]>) {
      const set = new Set(state.order);
      const missing = a.payload.filter((id) => !set.has(id));
      if (missing.length) {
        state.order = state.order.concat(missing);
        save(state.order);
      }
    },
  },
});

export const groupOrderReducer = slice.reducer;
export const groupOrderActions = slice.actions;

export const selectGroupOrder = (s: RootState) => s.groupOrder.order;