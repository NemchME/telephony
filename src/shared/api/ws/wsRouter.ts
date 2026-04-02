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
  const callServices = b.services.filter((s: BundleService) => s.type === 'Call');
  if (callServices.length === 0) return false;
  return callServices.every(isServiceTerminated);
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

        if (isBundleTerminated(b)) {
          if (import.meta.env.DEV) {
            console.log('[WS] Bundle terminated, removing:', b.id);
          }
          ctx.dispatch(bundleActions.removeBundle(b.id));
        } else {
          ctx.dispatch(bundleActions.upsertBundle(b));
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
      for (const r of items) ctx.dispatch(cdrActions.upsertOne(r));
      break;
    }

    default:
      break;
  }
}
