import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';

export type CallGroupAgent = {
  id: string;
  userID: string;
  callGroupID: string;
  status?: number;
  timeout?: number;
  skill?: number;
  domainID?: string;
};

export type CallGroup = {
  id: string;
  name: string;
  commonName?: string;
  type?: string;
  numbers?: string[];
  agents?: CallGroupAgent[];
  domainID?: string;
};

export type CallGroupAgentState = {
  id: string;
  userID: string;
  callGroupID: string;
  status: string;
  lastModifiedStatus?: number;
  domainID?: string;
};

export type QueueItem = {
  id: string;
  cidNumber?: string;
  cidName?: string;
  enqueuedTimeSec?: number;
  blocked?: boolean;
};

export type CallGroupState = {
  id: string;
  domainID?: string;
  queue?: QueueItem[];
};

export type ListResponse<T> = { elements: T[] };

export const callGroupApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getCallGroups: build.query<ListResponse<CallGroup>, void>({
      query: () => rpcMethods.callGroupSearch({}),
      providesTags: ['CallGroup'],
    }),

    getCallGroupAgents: build.query<ListResponse<CallGroupAgent>, void>({
      query: () => rpcMethods.callGroupAgentSearch({}),
    }),

    getCallGroupAgentStates: build.query<ListResponse<CallGroupAgentState>, void>({
      query: () => rpcMethods.callGroupAgentStateSearch({}),
    }),

    getCallGroupStates: build.query<ListResponse<CallGroupState>, void>({
      query: () => rpcMethods.callGroupStateSearch({}),
    }),

    resetAgentState: build.mutation<unknown, { callGroupID: string; userID: string }>({
      query: ({ callGroupID, userID }) => rpcMethods.callGroupAgentStateReset(callGroupID, userID),
    }),

    resetUserState: build.mutation<unknown, { userID: string }>({
      query: ({ userID }) => rpcMethods.cmdResetUserState(userID),
    }),

    callgroupDequeue: build.mutation<unknown, { id: string }>({
      query: ({ id }) => rpcMethods.cmdCallgroupDequeue(id),
    }),

    updateAgentStatus: build.mutation<unknown, { callGroupID: string; userID: string; status: number }>({
      query: ({ callGroupID, userID, status }) => rpcMethods.callGroupAgentUpdate(callGroupID, userID, status),
    }),
  }),
});

export const {
  useGetCallGroupsQuery,
  useGetCallGroupAgentsQuery,
  useGetCallGroupAgentStatesQuery,
  useGetCallGroupStatesQuery,
  useResetAgentStateMutation,
  useResetUserStateMutation,
  useUpdateAgentStatusMutation,
  useCallgroupDequeueMutation,
} = callGroupApi;
