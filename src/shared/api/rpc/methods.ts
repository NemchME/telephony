export const RpcMethods = {
  Authentificate: "Authentificate",
  Terminate: "Terminate",

  UserSearch: "User.Search",
  UserUpdate: "User.Update",
  UserStateSearch: "UserState.Search",

  CallGroupSearch: "CallGroup.Search",
  CallGroupStateSearch: "CallGroupState.Search",
  CallGroupAgentSearch: "CallGroupAgent.Search",
  CallGroupAgentStateSearch: "CallGroupAgentState.Search",

  BundleStateSearch: "BundleState.Search",

  CdrSearch: "CDR.Search",
  SpecialCdrSearch: "Special.CDR.Search",
} as const;

export type RpcMethodName = (typeof RpcMethods)[keyof typeof RpcMethods];