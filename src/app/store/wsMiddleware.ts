import type { Middleware } from '@reduxjs/toolkit';
import { setSession, clearSession } from '@/entities/session/model/sessionSlice';
import { WsClient } from '@/shared/api/ws/wsClient';
import { routeWsMessage } from '@/shared/api/ws/wsRouter';
import { env } from '@/app/config/env';

let client: WsClient | null = null;

export const wsMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (setSession.match(action)) {
    if (client) {
      client.disconnect();
      client = null;
    }

    client = new WsClient();
    client.subscribe((event, raw) => {
      routeWsMessage(event, raw, {
        dispatch: store.dispatch,
        getState: store.getState,
      });
    });

    const wsUrl = env.WS_URL.startsWith('ws')
      ? env.WS_URL
      : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${env.WS_URL}`;

    client.connect(wsUrl);
    return result;
  }

  if (clearSession.match(action)) {
    if (client) {
      client.disconnect();
      client = null;
    }
    return result;
  }

  return result;
};
