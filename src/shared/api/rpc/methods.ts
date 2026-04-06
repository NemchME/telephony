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

  userSetAvailStatus: (userId: string, availStatus: string, busyStatus?: string): RpcRequest => ({
    method: 'User.Update',
    filter: { id: userId },
    data: { availStatus, ...(busyStatus != null ? { busyStatus } : {}) },
  }),

  callGroupSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'CallGroup.Search',
    filter,
  }),

  callGroupAgentSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'CallGroupAgent.Search',
    filter,
  }),

  callGroupAgentStateSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'CallGroupAgentState.Search',
    filter,
  }),

  callGroupStateSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'CallGroupState.Search',
    filter,
  }),

  bundleStateSearch: (filter: Record<string, unknown> = {}): RpcRequest => ({
    method: 'BundleState.Search',
    filter,
  }),

  callCreate: (cgpn: string, cdpn: string): RpcRequest => ({
    method: 'Call.Create',
    data: { cgpn, cdpn },
  }),

  callHangup: (callId: string): RpcRequest => ({
    method: 'Call.Hangup',
    filter: { id: callId },
  }),

  callGroupAgentStateReset: (callGroupID: string, userID: string): RpcRequest => ({
    method: 'CallGroupAgentState.Reset',
    filter: { callGroupID, userID },
  }),

  cmdResetUserState: (userID: string): RpcRequest => ({
    method: 'Cmd.ResetUserState',
    params: { userID },
  }),

  callTransfer: (callId: string, destination: string): RpcRequest => ({
    method: 'Call.Transfer',
    filter: { id: callId },
    data: { destination },
  }),

  callConsultTransfer: (callId: string, destination: string): RpcRequest => ({
    method: 'Call.ConsultTransfer',
    filter: { id: callId },
    data: { destination },
  }),

  userUpdateSettings: (userId: string, settings: string): RpcRequest => ({
    method: 'User.Update',
    filter: { id: userId },
    data: { settings },
  }),

  callGroupAgentUpdate: (callGroupID: string, userID: string, status: number): RpcRequest => ({
    method: 'Config.CallGroupAgent.Update',
    filter: { callGroupID, userID },
    data: { status },
  }),
} as const;
