import type { UnknownAction } from '@reduxjs/toolkit';
import type { WsEvent, WsRawMessage } from './wsClient';
import { userActions, type User, type UserStateRecord } from '@/entities/user/model/userSlice';
import {
  callGroupActions,
  type CallGroupState,
  type CallGroupAgent,
  type CallGroupAgentState,
} from '@/entities/callGroup/model/callGroupSlice';
import { bundleActions, type Bundle } from '@/entities/bundle/model/bundleSlice';
import { cdrActions, type CdrRecord } from '@/entities/cdr/model/cdrSlice';

export type WsRouteCtx = {
  dispatch: (action: UnknownAction) => UnknownAction;
  getState: () => unknown;
};

export function routeWsMessage(event: WsEvent, _raw: WsRawMessage, ctx: WsRouteCtx): void {
  if (!event?.type) return;
  const data = event.payload;
  if (!data || typeof data !== 'object') return;

  switch (event.type) {
    case 'VirtaEvent.User.Updated':
      ctx.dispatch(userActions.upsertOne(data as User));
      break;

    case 'VirtaEvent.UserState.Updated':
      ctx.dispatch(userActions.upsertUserState(data as UserStateRecord));
      break;

    case 'VirtaEvent.CallGroupState.Updated':
      ctx.dispatch(callGroupActions.upsertCallGroupState(data as CallGroupState));
      break;

    case 'VirtaEvent.CallGroupAgent.Updated':
      ctx.dispatch(callGroupActions.upsertCallGroupAgent(data as CallGroupAgent));
      break;

    case 'VirtaEvent.CallGroupAgentState.Updated':
      ctx.dispatch(callGroupActions.upsertCallGroupAgentState(data as CallGroupAgentState));
      break;

    case 'VirtaEvent.BundleState.Updated':
      ctx.dispatch(bundleActions.upsertBundle(data as Bundle));
      break;

    case 'VirtaEvent.BundleState.Destroyed': {
      const destroyed = data as Record<string, unknown>;
      if (typeof destroyed.id === 'string') {
        ctx.dispatch(bundleActions.removeBundle(destroyed.id));
      }
      break;
    }

    case 'VirtaEvent.CDR.Updated':
      ctx.dispatch(cdrActions.upsertOne(data as CdrRecord));
      break;

    default:
      break;
  }
}
