import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';
import type { Bundle } from '@/entities/bundle/model/bundleSlice';

export type BundleStateResponse = { elements: Bundle[] };

export const bundleApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getBundleState: build.query<BundleStateResponse, void>({
      query: () => rpcMethods.bundleStateSearch({}),
    }),
  }),
});

export const { useGetBundleStateQuery } = bundleApi;
