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
  callerRecords?: unknown[];
  calleeRecords?: unknown[];
  [k: string]: unknown;
};

export type CdrSearchArgs = {
  begin: number;
  end: number;
  number?: string;

  userName?: string;
  domainID?: string;
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
      query: (args) => {
        const filter = {
          begin: args.begin,
          end: args.end,
          ...(args.userName != null ? { userName: args.userName } : {}),
          ...(args.domainID != null ? { domainID: args.domainID } : {}),
          limit: args.limit ?? 50,
          offset: args.offset ?? 0,
          sort: "desc",
        };
        if (import.meta.env.DEV) {
          console.log('[CDR.Search] filter →', filter);
        }
        return { method: "CDR.Search", filter };
      },
      transformResponse: (res: unknown) => normalizeCdr(res as RawCdrResponse),
    }),
  }),
  overrideExisting: false,
});

export const { useCdrSearchQuery } = cdrApi;
