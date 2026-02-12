export const callGroupEvents = {
  snapshot: "callGroup/snapshot",
  upsertMany: "callGroup/upsertMany",
  removeMany: "callGroup/removeMany",
} as const;

export type CallGroupEventType = (typeof callGroupEvents)[keyof typeof callGroupEvents];