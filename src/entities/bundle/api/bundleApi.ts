import { apiSlice } from "@/app/store/api/apiSlice";

type BundleService = {
  id: string;
  type: string;
  createdTime?: number;
  hangupTime?: string;
  [k: string]: unknown;
};

type BundleState = {
  id: string;
  domainID: string;
  services: BundleService[];
};

export const bundleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBundleState: builder.query<{ elements?: BundleState[] } | BundleState[], void>({
      query: () => ({ method: "BundleState.Search" }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetBundleStateQuery } = bundleApi;