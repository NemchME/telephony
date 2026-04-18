import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { env } from "@/app/config/env";

export type RpcBody = {
  method: string;
  data?: unknown;
  filter?: unknown;
  requestPurpose?: string;
};

type BaseQueryError = { status: string | number; data: unknown };

type RpcRawResponse = Record<string, unknown> | null;

const safeJson = (res: Response): Promise<RpcRawResponse> =>
  res.json().catch(() => null) as Promise<RpcRawResponse>;

export const rpcBaseQuery =
  (): BaseQueryFn<RpcBody, unknown, BaseQueryError> =>
  async (body) => {
    try {
      const finalBody: RpcBody =
        body.method === "Authentificate"
          ? {
              ...body,
              data: {
                ...(body.data as Record<string, unknown> | undefined),
                requestPurpose:
                  (body.data as { requestPurpose?: string } | undefined)
                    ?.requestPurpose ?? "clientView",
              },
            }
          : body;

      const res = await fetch(env.API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(finalBody),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        return { error: { status: res.status, data: json ?? { message: `HTTP ${res.status}` } } };
      }

      if (json && typeof json === "object" && "error" in json && json.error) {
        return { error: { status: "RPC_ERROR", data: json } };
      }

      return { data: json };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Network error";
      return { error: { status: "FETCH_ERROR", data: { message } } };
    }
  };
