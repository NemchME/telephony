import type { RpcErrorPayload } from "./rpcTypes";

export function isRpcError(x: unknown): x is RpcErrorPayload {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    "message" in x &&
    typeof (x as any).error === "number" &&
    typeof (x as any).message === "string"
  );
}

export function unwrapOrThrow<T>(raw: unknown): T {
  if (isRpcError(raw)) {
    throw raw;
  }
  return raw as T;
}