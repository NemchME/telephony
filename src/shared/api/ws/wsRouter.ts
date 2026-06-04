import type { UnknownAction } from '@reduxjs/toolkit';
import type { WsEvent, WsRawMessage } from './wsClient';
import { userActions, type User, type UserStateRecord } from '@/entities/user/model/userSlice';
import {
  callGroupActions,
  type CallGroupState,
  type CallGroupAgent,
  type CallGroupAgentState,
} from '@/entities/callGroup/model/callGroupSlice';
import { bundleActions, type Bundle, type BundleService } from '@/entities/bundle/model/bundleSlice';
import { cdrActions, type CdrRecord } from '@/entities/cdr/model/cdrSlice';
import { setAvailStatus } from '@/entities/session/model/sessionSlice';
import { incrementMissed } from '@/entities/missedCalls/model/missedCallsSlice';
import { crmActions } from '@/entities/crm/model/crmSlice';
import {
  showIncomingCallNotification,
  showMissedCallNotification,
  closeIncomingNotification,
} from '@/shared/lib/notifications/notifications';

const wsNotifiedRinging = new Set<string>();
const wsNotifiedTerminated = new Set<string>();
const wsCrmActivated = new Set<string>();
import type { RootState } from '@/app/store/rootReducer';

export type WsRouteCtx = {
  dispatch: (action: UnknownAction) => UnknownAction;
  getState: () => RootState;
};

const TERMINATED_CONN_STATES = new Set([
  'hangup', 'destroy', 'completed', 'failed', 'canceled',
  'terminated', 'disconnected', 'released', 'bye',
]);

function isServiceTerminated(s: BundleService): boolean {
  if (s.connState && TERMINATED_CONN_STATES.has(s.connState)) return true;
  if (s.hangupTime) return true;
  if (typeof s.callState === 'number' && s.callState === 0 && s.connState !== 'ringing') return true;
  return false;
}

function isBundleTerminated(b: Bundle): boolean {
  if (!b.services || b.services.length === 0) return false;
  const activeServices = b.services.filter((s: BundleService) => s.type === 'Call' || s.type === 'Routing');
  if (activeServices.length === 0) return false;
  return activeServices.every(isServiceTerminated);
}

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') return [payload as T];
  return [];
}

export function routeWsMessage(event: WsEvent, _raw: WsRawMessage, ctx: WsRouteCtx): void {
  if (!event?.type) return;
  const data = event.payload;
  if (!data || typeof data !== 'object') return;

  if (import.meta.env.DEV) {
    console.log('[WS]', event.type, data);
  }

  switch (event.type) {
    case 'VirtaEvent.User.Updated': {
      const items = extractItems<User>(data);
      for (const u of items) {
        ctx.dispatch(userActions.upsertOne(u));
        const state = ctx.getState();
        if (state.session.userId === u.id && u.availStatus != null) {
          const avail = u.availStatus;
          const busy = u.busyStatus;
          let compound: string;
          if (busy && busy !== '_' && busy !== avail) {
            compound = `${avail}_${busy}`;
          } else {
            compound = `${avail}_${avail}`;
          }
          ctx.dispatch(setAvailStatus(compound));
        }
      }
      break;
    }

    case 'VirtaEvent.UserState.Updated': {
      const items = extractItems<UserStateRecord>(data);
      for (const s of items) ctx.dispatch(userActions.upsertUserState(s));
      break;
    }

    case 'VirtaEvent.CallGroupState.Updated': {
      const items = extractItems<CallGroupState>(data);
      for (const s of items) ctx.dispatch(callGroupActions.upsertCallGroupState(s));
      break;
    }

    case 'VirtaEvent.CallGroupAgent.Updated': {
      const items = extractItems<CallGroupAgent>(data);
      for (const a of items) ctx.dispatch(callGroupActions.upsertCallGroupAgent(a));
      break;
    }

    case 'VirtaEvent.CallGroupAgentState.Updated': {
      const items = extractItems<CallGroupAgentState>(data);
      for (const s of items) ctx.dispatch(callGroupActions.upsertCallGroupAgentState(s));
      break;
    }

    case 'VirtaEvent.BundleState.Updated': {
      const items = extractItems<Bundle>(data);
      for (const b of items) {
        if (import.meta.env.DEV) {
          for (const s of b.services ?? []) {
            if (s.type === 'Call') {
              console.log('[WS] Bundle call service:', {
                bundleId: b.id,
                serviceId: s.id,
                connState: s.connState,
                callState: s.callState,
                hangupTime: s.hangupTime,
              });
            }
          }
        }

        const session = ctx.getState().session;
        const myId = session.userId;
        const useVerto = session.useVerto;

        if (isBundleTerminated(b)) {
          if (import.meta.env.DEV) {
            console.log('[WS] Bundle terminated, removing:', b.id);
          }
          for (const s of b.services ?? []) {
            if (s.type !== 'Call') continue;
            if (wsNotifiedRinging.has(s.id)) {
              wsNotifiedTerminated.add(s.id);
              closeIncomingNotification(s.id);
            }
          }
          ctx.dispatch(bundleActions.removeBundle(b.id));
        } else {
          ctx.dispatch(bundleActions.upsertBundle(b));
          for (const s of b.services ?? []) {
            if (s.type !== 'Call') continue;
            const calleeUserId = s['callee.userID'] as string | undefined;
            const cgpn = s.cgpn || (s['caller.commonNumber'] as string | undefined);
            const isInbound = !!(calleeUserId && myId && calleeUserId === myId);

            if (isInbound && !TERMINATED_CONN_STATES.has(s.connState ?? '')) {
              if (cgpn) {
                if (import.meta.env.DEV) {
                  console.log('[CRM] lastIncomingNumber ←', cgpn,
                    '(service', s.id, 'state', s.connState, ')');
                }
                ctx.dispatch(crmActions.setLastIncomingNumber(String(cgpn)));
              }
              if (!wsCrmActivated.has(s.id)) {
                wsCrmActivated.add(s.id);
                ctx.dispatch(crmActions.requestCrmActivation());
              }
            }
            if (!useVerto && isInbound && s.connState === 'ringing' && !wsNotifiedRinging.has(s.id)) {
              wsNotifiedRinging.add(s.id);
              const name = (s['caller.commonName'] as string | undefined) || '';
              void showIncomingCallNotification({
                callID: s.id,
                name,
                number: String(cgpn ?? ''),
                canAnswer: false,
              });
            }
          }
        }
      }
      break;
    }

    case 'VirtaEvent.BundleState.Destroyed': {
      const items = extractItems<Record<string, unknown>>(data);
      for (const d of items) {
        if (typeof d.id === 'string') {
          ctx.dispatch(bundleActions.removeBundle(d.id));
        }
      }
      break;
    }

    case 'VirtaEvent.CDR.Updated': {
      const items = extractItems<CdrRecord>(data);
      for (const r of items) {
        ctx.dispatch(cdrActions.upsertOne(r));

        const state = ctx.getState();
        const myId = state.session.userId;
        const useVerto = state.session.useVerto;
        if (!myId) continue;

        const calleeUserId = (r as Record<string, unknown>)['callee.userID'] as string | undefined;
        const callerUserId = (r as Record<string, unknown>)['caller.userID'] as string | undefined;
        const callerAuthorized = Boolean((r as Record<string, unknown>)['caller.authorized']);
        const calleeAuthorized = Boolean((r as Record<string, unknown>)['callee.authorized']);
        const isIncoming =
          (calleeUserId === myId && callerUserId !== myId) ||
          (!callerAuthorized && calleeAuthorized);

        const answered = Number(r.answeredTime ?? 0) > 0;
        const hangup = Number(r.hangupTime ?? 0) > 0;

        if (import.meta.env.DEV && isIncoming) {
          console.log('[CDR] incoming', r.id, 'answered:', answered, 'hangup:', hangup,
            '→ missed:', !answered && hangup);
        }

        if (isIncoming && !answered && hangup) {
          ctx.dispatch(incrementMissed({ id: r.id }));
          if (!useVerto) {
            const cgpn = (r['caller.commonNumber'] as string | undefined) || r.cgpn || '';
            const name = (r['caller.commonName'] as string | undefined) || '';
            void showMissedCallNotification({ callID: r.id, name, number: String(cgpn) });
          }
        }
      }
      break;
    }

    default:
      break;
  }
}
