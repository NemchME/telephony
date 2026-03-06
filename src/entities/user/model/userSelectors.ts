import type { RootState } from '@/app/store/store';

export const selectUsers = (s: RootState) => s.user.ids.map((id) => s.user.entities[id]!);
export const selectUserEntities = (s: RootState) => s.user.entities;
export const selectUserStates = (s: RootState) => s.user.states;
export const selectUserById = (id: string) => (s: RootState) => s.user.entities[id];
export const selectUserStateById = (id: string) => (s: RootState) => s.user.states[id];
