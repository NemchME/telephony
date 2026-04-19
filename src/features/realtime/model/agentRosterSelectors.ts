import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store/store';
import { selectGroupOrder } from '@/features/realtime/model/groupOrderSlice';

export type UiPresence =
  | 'OFFLINE'
  | 'ONLINE_AVAILABLE'
  | 'ONLINE_DIRECT'
  | 'ONLINE_DND'
  | 'ONLINE_AWAY'
  | 'ONLINE_BUSY'
  | 'UNKNOWN';

export type GroupHeaderRow = {
  kind: 'group';
  groupId: string;
  groupName: string;
  groupTechName: string;
  numbers: string[];
  queueLength: number;
};

export type AgentRow = {
  kind: 'agent';
  userId: string;
  groupId: string;
  displayName: string;
  username: string;
  numbers: string[];
  availStatus: string;
  busyStatus: string;
  availStatusLabel: string;
  networkStatus: number;
  busyCount: number;
  agentStatus: string;
  lastModifiedStatus: number | undefined;
  lastModifiedUserState: number | undefined;
  lastModifiedAvailStatus: number | undefined;
  presence: UiPresence;
  agentEnabled: boolean;
  leftGroup: boolean;
};

export type RosterRow = GroupHeaderRow | AgentRow;

const AVAIL_LABELS: Record<string, string> = {
  avail: 'Нормальное',
  direct: 'Прям. вызовы',
  dnd: 'Не беспокоить',
  away: 'Отошёл',
};

function calcPresence(p: {
  networkStatus: number | undefined;
  busyCount: number | undefined;
  availStatus: string | undefined;
}): UiPresence {
  if (p.networkStatus === -1 || p.networkStatus === 0) return 'OFFLINE';
  if (p.networkStatus !== 1) return 'UNKNOWN';
  if (p.availStatus === 'dnd') return 'ONLINE_DND';
  if (p.availStatus === 'away') return 'ONLINE_AWAY';
  if (p.availStatus === 'direct') return 'ONLINE_DIRECT';
  if ((p.busyCount ?? 0) > 0) return 'ONLINE_BUSY';
  return 'ONLINE_AVAILABLE';
}

function presenceToDotClass(p: UiPresence): string {
  switch (p) {
    case 'OFFLINE': return 'status-dot--offline';
    case 'ONLINE_AVAILABLE': return 'status-dot--online';
    case 'ONLINE_DIRECT': return 'status-dot--online';
    case 'ONLINE_DND': return 'status-dot--dnd';
    case 'ONLINE_AWAY': return 'status-dot--away';
    case 'ONLINE_BUSY': return 'status-dot--busy';
    default: return 'status-dot--offline';
  }
}
export { presenceToDotClass };

export const selectRoster = createSelector(
  [
    (s: RootState) => s.user.entities,
    (s: RootState) => s.user.ids,
    (s: RootState) => s.user.states,
    (s: RootState) => s.callGroup.items,
    (s: RootState) => s.callGroup.agents,
    (s: RootState) => s.callGroup.agentStates,
    (s: RootState) => s.callGroup.states,
    selectGroupOrder,
  ],
  (userEntities, userIds, userStates, groups, agents, agentStates, groupStates, groupOrder) => {
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    const orderedGroupIds = [...groupOrder];
    for (const g of groups) {
      if (!orderedGroupIds.includes(g.id)) orderedGroupIds.push(g.id);
    }

    const agentStateMap = new Map<string, typeof agentStates[0]>();
    for (const as of agentStates) {
      agentStateMap.set(`${as.callGroupID}:${as.userID}`, as);
    }

    const agentMap = new Map<string, typeof agents[0]>();
    for (const a of agents) {
      agentMap.set(`${a.callGroupID}:${a.userID}`, a);
    }

    const agentsByGroup = new Map<string, string[]>();
    for (const a of agents) {
      const arr = agentsByGroup.get(a.callGroupID) ?? [];
      arr.push(a.userID);
      agentsByGroup.set(a.callGroupID, arr);
    }

    const queueMap = new Map<string, number>();
    for (const gs of groupStates) {
      queueMap.set(gs.id, Array.isArray(gs.queue) ? gs.queue.length : 0);
    }

    const usersInGroups = new Set<string>();
    for (const a of agents) usersInGroups.add(a.userID);

    const rows: RosterRow[] = [];

    for (const gid of orderedGroupIds) {
      const g = groupMap.get(gid);
      if (!g) continue;

      rows.push({
        kind: 'group',
        groupId: g.id,
        groupName: g.commonName ?? g.name,
        groupTechName: g.name,
        numbers: g.numbers ?? [],
        queueLength: queueMap.get(g.id) ?? 0,
      });

      const memberIds = agentsByGroup.get(g.id) ?? [];
      const activeRows: AgentRow[] = [];
      const leftRows: AgentRow[] = [];
      for (const uid of memberIds) {
        const user = userEntities[uid];
        if (!user) continue;
        const uState = userStates[uid];
        const agentCfg = agentMap.get(`${g.id}:${uid}`);
        const agentSt = agentStateMap.get(`${g.id}:${uid}`);
        const leftGroup = agentCfg?.status === 0;

        const presence = calcPresence({
          networkStatus: uState?.networkStatus,
          busyCount: uState?.busyCount,
          availStatus: user.availStatus,
        });

        const row: AgentRow = {
          kind: 'agent',
          userId: uid,
          groupId: g.id,
          displayName: user.commonName ?? user.name ?? uid,
          username: user.name ?? uid,
          numbers: user.numbers ?? [],
          availStatus: user.availStatus ?? 'avail',
          busyStatus: user.busyStatus ?? '_',
          availStatusLabel: AVAIL_LABELS[user.availStatus ?? ''] ?? user.availStatus ?? '',
          networkStatus: uState?.networkStatus ?? -1,
          busyCount: uState?.busyCount ?? 0,
          agentStatus: agentSt?.status ?? '__undef__',
          lastModifiedStatus: agentSt?.lastModifiedStatus,
          lastModifiedUserState: uState?.lastModifiedBusyCount ?? uState?.lastModified,
          lastModifiedAvailStatus: user.lastModifiedAvailStatus ?? user.lastModifiedTime,
          presence,
          agentEnabled: agentCfg?.status === 1,
          leftGroup,
        };

        if (leftGroup) leftRows.push(row);
        else activeRows.push(row);
      }
      for (const r of activeRows) rows.push(r);
      for (const r of leftRows) rows.push(r);
    }


    return rows;
  },
);
