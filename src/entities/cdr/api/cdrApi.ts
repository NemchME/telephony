import { apiSlice } from "@/app/store/api/apiSlice";

export type CdrRow = {
  id?: string;
  createdTime?: number;
  answeredTime?: number;
  hangupTime?: number;
  cgpn?: string;
  cdpn?: string;
  cids?: string;
  type?: string;
  connState?: string;
  'caller.commonName'?: string;
  'caller.commonNumber'?: string;
  'callee.commonName'?: string;
  'callee.commonNumber'?: string;
  [k: string]: unknown;
};

export type CdrSearchArgs = {
  begin: number;
  end: number;
  number?: string;
  limit?: number;
  offset?: number;
};

export type CdrSearchResponse = {
  elements: CdrRow[];
  total: number | undefined;
  offset: number | undefined;
};

type RawCdrResponse = {
  elements?: CdrRow[];
  total?: number;
  offset?: number;
} | CdrRow[];

const normalizeCdr = (res: RawCdrResponse): CdrSearchResponse => {
  if (Array.isArray(res)) return { elements: res, total: undefined, offset: undefined };
  return {
    elements: res?.elements ?? [],
    total: res?.total,
    offset: res?.offset,
  };
};

export const cdrApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    cdrSearch: builder.query<CdrSearchResponse, CdrSearchArgs>({
      query: (args) => ({
        method: "CDR.Search",
        filter: {
          begin: args.begin,
          end: args.end,
          number: args.number,
          limit: args.limit ?? 50,
          offset: args.offset ?? 0,
          sort: "desc",
        },
      }),
      transformResponse: (res: unknown) => normalizeCdr(res as RawCdrResponse),
    }),
  }),
  overrideExisting: false,
});

export const { useCdrSearchQuery } = cdrApi;
