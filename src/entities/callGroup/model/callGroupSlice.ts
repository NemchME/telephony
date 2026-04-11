import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CallGroup = { id: string; name: string; commonName?: string; numbers?: string[]; domainID?: string };
export type CallGroupAgent = {
  id: string;
  userID: string;
  callGroupID: string;
  status?: number;
  timeout?: number;
  skill?: number;
  domainID?: string;
};
export type CallGroupAgentState = {
  id: string;
  userID: string;
  callGroupID: string;
  status: 'ready' | 'busy' | 'unavail' | '__undef__' | string;
  lastModifiedStatus?: number;
  domainID?: string;
};
export type CallGroupState = { id: string; domainID?: string; queue?: unknown[] };

export type CallGroupSliceState = {
  items: CallGroup[];
  agents: CallGroupAgent[];
  agentStates: CallGroupAgentState[];
  states: CallGroupState[];
};

const initialState: CallGroupSliceState = {
  items: [],
  agents: [],
  agentStates: [],
  states: [],
};

export const callGroupSlice = createSlice({
  name: 'callGroup',
  initialState,
  reducers: {
    setCallGroups: (s, a: PayloadAction<CallGroup[]>) => { s.items = a.payload; },
    setCallGroupAgents: (s, a: PayloadAction<CallGroupAgent[]>) => { s.agents = a.payload; },
    setCallGroupAgentStates: (s, a: PayloadAction<CallGroupAgentState[]>) => { s.agentStates = a.payload; },
    setCallGroupStates: (s, a: PayloadAction<CallGroupState[]>) => { s.states = a.payload; },
    upsertCallGroupState(s, a: PayloadAction<CallGroupState>) {
      const idx = s.states.findIndex((x) => x.id === a.payload.id);
      if (idx >= 0) s.states[idx] = a.payload;
      else s.states.push(a.payload);
    },
    upsertCallGroupAgent(s, a: PayloadAction<CallGroupAgent>) {
      const key = `${a.payload.callGroupID}:${a.payload.userID}`;
      const idx = s.agents.findIndex((x) => `${x.callGroupID}:${x.userID}` === key);
      if (idx >= 0) s.agents[idx] = { ...s.agents[idx], ...a.payload };
      else s.agents.push(a.payload);
    },
    upsertCallGroupAgentState(s, a: PayloadAction<CallGroupAgentState>) {
      const key = `${a.payload.callGroupID}:${a.payload.userID}`;
      const idx = s.agentStates.findIndex((x) => `${x.callGroupID}:${x.userID}` === key);
      if (idx >= 0) s.agentStates[idx] = { ...s.agentStates[idx], ...a.payload };
      else s.agentStates.push(a.payload);
    },
    reset() {
      return initialState;
    },
  },
});

export const {
  setCallGroups,
  setCallGroupAgents,
  setCallGroupAgentStates,
  setCallGroupStates,
} = callGroupSlice.actions;

export const callGroupActions = callGroupSlice.actions;
export const callGroupReducer = callGroupSlice.reducer;
