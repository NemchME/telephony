export type RpcRequest<TData = unknown, TFilter = unknown> = {
  method: string;
  data?: TData;
  filter?: TFilter;
  token?: string;
};

export type RpcErrorPayload = {
  error: number;
  message: string;
};

export type RpcListResponse<T> = {
  elements: T[];
  total?: number;
  offset?: number;
  error?: number;
  message?: string;
};

export type RpcDataResponse<T> = {
  data: T;
  error?: number;
  message?: string;
};

export type RpcOk<T> = RpcListResponse<T> | RpcDataResponse<T> | unknown;