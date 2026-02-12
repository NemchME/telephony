import type { BaseQueryFn } from "@reduxjs/toolkit/query";
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

type BaseQueryError = { status: string | number; data: RpcErr | any };

function safeJsonParse(res: Response) {
  return res.json().catch(() => null);
}

export const rpcBaseQuery =
  (): BaseQueryFn<RpcBody, RpcOk, BaseQueryError> =>
  async (body) => {
    try {
      const finalBody: RpcBody =
        body.method === "Authentificate"
          ? { ...body, requestPurpose: body.requestPurpose ?? "clientView" }
          : { ...body };


      const res = await fetch(env.API_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      });

      const json = await safeJsonParse(res);

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
      return {
        error: {
          status: "FETCH_ERROR",
          data: { message: e?.message ?? "Network error" },
        },
      };
    }
  };