import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CallGroup = { id: string; name: string; commonName?: string; numbers?: string[] };
export type CallGroupAgent = {
  id: string;
  userID: string;
  callGroupID: string;
  status?: number;
  timeout?: number;
  skill?: number;
};
export type CallGroupAgentState = {
  id: string;
  userID: string;
  callGroupID: string;
  status: 'ready' | 'busy' | 'unavail' | '__undef__' | string;
  lastModifiedStatus?: number;
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
    setCallGroups: (s, a: PayloadAction<CallGroup[]>) => {
      s.items = a.payload;
    },
    setCallGroupAgents: (s, a: PayloadAction<CallGroupAgent[]>) => {
      s.agents = a.payload;
    },
    setCallGroupAgentStates: (s, a: PayloadAction<CallGroupAgentState[]>) => {
      s.agentStates = a.payload;
    },
    setCallGroupStates: (s, a: PayloadAction<CallGroupState[]>) => {
      s.states = a.payload;
    },
  },
});

export const {
  setCallGroups,
  setCallGroupAgents,
  setCallGroupAgentStates,
  setCallGroupStates,
} = callGroupSlice.actions;

export const callGroupReducer = callGroupSlice.reducer;