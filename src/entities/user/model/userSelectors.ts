import type { RootState } from '@/app/store/store';

export const selectUsers = (s: RootState) => s.user?.items ?? [];
export const selectUserStates = (s: RootState) => s.user?.states ?? [];