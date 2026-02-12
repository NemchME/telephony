// src/entities/callGroup/api/callGroupApi.ts
import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';

export type CallGroupAgent = {
  userID: string;
  status?: number;
  timeout?: number;
  skill?: number;
};

export type CallGroup = {
  id: string;
  name: string;
  commonName?: string;
  type?: string;
  numbers?: string[];
  agents?: CallGroupAgent[];
  lastModifiedTime?: number;
};

export type CallGroupsResponse = { elements: CallGroup[] };

export const callGroupApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getCallGroups: build.query<CallGroupsResponse, void>({
      query: () => rpcMethods.callGroupSearch({}), // пустой фильтр = все
      providesTags: ['CallGroups'],
    }),
  }),
});

export const { useGetCallGroupsQuery } = callGroupApi;