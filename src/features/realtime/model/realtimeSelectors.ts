import type { RootState } from '@/app/store/store';

export const selectUsers = (s: RootState) => s.user.ids.map((id) => s.user.entities[id]!);
export const selectUserStates = (s: RootState) => Object.values(s.user.states);
