import type { RootState } from '@/app/store/store';

export const selectCallGroups = (s: RootState) => s.callGroup?.items ?? [];
export const selectCallGroupAgents = (s: RootState) => s.callGroup?.agents ?? [];
export const selectCallGroupAgentStates = (s: RootState) => s.callGroup?.agentStates ?? [];
export const selectCallGroupStates = (s: RootState) => s.callGroup?.states ?? [];