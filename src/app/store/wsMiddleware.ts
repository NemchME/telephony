import type { Middleware } from '@reduxjs/toolkit';
import { setSession, clearSession, setWsStatus } from '@/entities/session/model/sessionSlice';
import { WsClient } from '@/shared/api/ws/wsClient';
import type { WsConnectionState } from '@/shared/api/ws/wsClient';
import { routeWsMessage } from '@/shared/api/ws/wsRouter';
import { env } from '@/app/config/env';
import type { RootState } from '@/app/store/rootReducer';

let client: WsClient | null = null;
let unsubscribeState: (() => void) | null = null;
let unsubscribeMessages: (() => void) | null = null;

function mapWsState(state: WsConnectionState) {
  switch (state) {
    case 'connected': return 'connected' as const;
    case 'connecting': return 'connecting' as const;
    case 'reconnecting': return 'reconnecting' as const;
    default: return 'disconnected' as const;
  }
}

export const wsMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (setSession.match(action)) {
    if (client) {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeState) unsubscribeState();
      client.disconnect();
      client = null;
    }

    client = new WsClient();

    unsubscribeMessages = client.subscribe((event, raw) => {
      routeWsMessage(event, raw, {
        dispatch: store.dispatch,
        getState: store.getState as () => RootState,
      });
    });

    unsubscribeState = client.onStateChange((wsState) => {
      store.dispatch(setWsStatus(mapWsState(wsState)));
    });

    const wsUrl = env.WS_URL.startsWith('ws')
      ? env.WS_URL
      : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${env.WS_URL}`;

    client.connect(wsUrl);
    return result;
  }

  if (clearSession.match(action)) {
    if (client) {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeState) unsubscribeState();
      client.disconnect();
      client = null;
      unsubscribeMessages = null;
      unsubscribeState = null;
    }
    return result;
  }

  return result;
};
