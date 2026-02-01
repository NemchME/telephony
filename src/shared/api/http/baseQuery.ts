// src/shared/api/http/baseQuery.ts
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store/store";
import { env } from "@/app/config/env";

type RpcBody = {
  method: string;
  data?: unknown;
  filter?: unknown;
  token?: string;
  requestPurpose?: string;
};

type RpcOk = any;
type RpcErr = { error?: number; message?: string };

export const rpcBaseQuery =
  (): BaseQueryFn<RpcBody, RpcOk, { status: string | number; data: RpcErr }> =>
  async (body, api) => {
    try {
      const state = api.getState() as RootState;
      const sessionID = state.session.sessionID;

      const withToken: RpcBody =
        body.method === "Authentificate"
          ? body
          : {
              ...body,
              token: body.token ?? sessionID ?? undefined,
            };

      if (withToken.method === "Authentificate") {
        withToken.requestPurpose = "clientView";
      }

      const res = await fetch(env.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withToken),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          error: {
            status: res.status,
            data: json ?? { message: `HTTP ${res.status}` },
          },
        };
      }
      if (json && typeof json === "object" && "error" in json && (json as any).error) {
        return { error: { status: "RPC_ERROR", data: json } };
      }

      return { data: json };
    } catch (e: any) {
      return { error: { status: "FETCH_ERROR", data: { message: e?.message ?? "Network error" } } };
    }
  };