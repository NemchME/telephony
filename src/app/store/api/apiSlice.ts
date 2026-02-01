import { createApi } from "@reduxjs/toolkit/query/react";
import { rpcBaseQuery } from "@/shared/api/http/baseQuery";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: rpcBaseQuery(),
  tagTypes: [
    "Session",
    "User",
    "UserState",
    "CallGroup",
    "CallGroupState",
    "CallGroupAgent",
    "CallGroupAgentState",
    "BundleState",
    "CDR",
    "Reports",
  ],
  endpoints: () => ({}),
});