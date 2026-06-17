import type { MagicRules } from '../model/types';

export function getForbiddenStatuses(
  manageTags: string[] | undefined,
  rules: MagicRules | undefined,
): string[] {
  const map = rules?.forbiddenStatusesByTag;
  if (!map || !manageTags || manageTags.length === 0) return [];
  const set = new Set<string>();
  for (const tag of manageTags) {
    const list = map[tag];
    if (Array.isArray(list)) {
      for (const s of list) set.add(s);
    }
  }
  return [...set];
}
export function isStatusForbidden(
  availStatus: string,
  manageTags: string[] | undefined,
  rules: MagicRules | undefined,
): boolean {
  return getForbiddenStatuses(manageTags, rules).includes(availStatus);
}

export function getConflictingGroupIds(
  targetGroupId: string,
  currentGroupIds: string[],
  rules: MagicRules | undefined,
): string[] {
  const clusters = rules?.exclusiveGroups;
  if (!clusters || clusters.length === 0) return [];
  const current = new Set(currentGroupIds);
  const conflicts = new Set<string>();
  for (const cluster of clusters) {
    if (!cluster.includes(targetGroupId)) continue;
    for (const gid of cluster) {
      if (gid !== targetGroupId && current.has(gid)) conflicts.add(gid);
    }
  }
  return [...conflicts];
}

export function canJoinGroup(
  targetGroupId: string,
  currentGroupIds: string[],
  rules: MagicRules | undefined,
): boolean {
  return getConflictingGroupIds(targetGroupId, currentGroupIds, rules).length === 0;
}