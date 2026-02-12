import type { RpcRequest } from './rpcTypes';

export const rpcMethods = {
  authenticate: (login: string, password: string): RpcRequest => ({
    method: 'Authentificate',
    data: { login, password },
  }),

  terminate: (): RpcRequest => ({ method: 'Terminate' }),

  usersList: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'User.Search',
    filter,
  }),

  userStatesList: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'UserState.Search',
    filter,
  }),

  userSetAvailStatus: (userId: string, availStatus: string): RpcRequest => ({
    method: 'User.Update',
    filter: { id: userId },
    data: { availStatus },
  }),

  callGroupSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'CallGroup.Search',
    filter,
  }),
} as const;