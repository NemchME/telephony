
import type { Middleware } from '@reduxjs/toolkit';
import { setSession, clearSession } from '@/entities/session/model/sessionSlice';
import { vertoActions } from './vertoSlice';
import { vertoClient } from '@/shared/api/verto/vertoClient';
import {
  createInboundSession,
  setRemoteAnswer,
  destroySession,
  destroyAllSessions,
} from '@/shared/api/verto/webrtcManager';
import type { VertoCall } from '@/shared/api/verto/vertoClient';
import type { RootState } from '@/app/store/rootReducer';
import { bundleActions, type BundleService } from '@/entities/bundle/model/bundleSlice';
import { callApi } from '@/entities/call/api/callApi';
import { env } from '@/app/config/env';
import { applySinkId } from '@/shared/lib/audio/audioDevices';
import {
  showIncomingCallNotification,
  showMissedCallNotification,
  closeIncomingNotification,
  hasActiveIncoming,
  onServiceWorkerAction,
} from '@/shared/lib/notifications/notifications';

const ALLOWED_RINGTONES = ['apple_ring', 'bell_ring'] as const;
type Ringtone = typeof ALLOWED_RINGTONES[number];

function readRingtoneFromSettings(getState: () => RootState): Ringtone {
  try {
    const state = getState();
    const myId = state.session.userId;
    if (!myId) return 'apple_ring';
    const u = state.user.entities[myId];
    const raw = u?.settings;
    if (typeof raw === 'string' && raw) {
      const parsed = JSON.parse(raw) as { ringtone?: string };
      const r = parsed.ringtone;
      if (r && (ALLOWED_RINGTONES as readonly string[]).includes(r)) {
        return r as Ringtone;
      }
    }
  } catch { /* ignore */ }
  return 'apple_ring';
}

let ringtoneAudio: HTMLAudioElement | null = null;

function startRingtone(getState: () => RootState) {
  stopRingtone();
  try {
    const ringtone = readRingtoneFromSettings(getState);
    const audio = new Audio(`/sounds/${ringtone}.mp3`);
    audio.loop = true;
    audio.volume = 0.8;
    applySinkId(audio);
    audio.play().catch(() => { /* autoplay policy */ });
    ringtoneAudio = audio;
  } catch { /* ignore */ }
}

export function stopRingtone() {
  if (ringtoneAudio) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    } catch { /* ignore */ }
    ringtoneAudio = null;
  }
}

function playEndSound() {
  try {
    const enabled = localStorage.getItem('settings.endCallSound') !== 'false';
    if (!enabled) return;
    const audio = new Audio('/sounds/end_call.mp3');
    audio.volume = 0.6;
    applySinkId(audio);
    audio.play().catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}

type StoreApi = {
  dispatch: (a: unknown) => unknown;
  getState: () => RootState;
};

function hangupAllBundles(store: StoreApi) {
  const state = store.getState();
  const { ids, entities } = state.bundle;
  for (const bid of ids) {
    const b = entities[bid];
    if (b) {
      const callServices = b.services.filter((s: BundleService) => s.type === 'Call');
      for (const svc of callServices) {
        store.dispatch(callApi.endpoints.hangupCall.initiate({ callId: svc.id }) as unknown as ReturnType<typeof bundleActions.removeBundle>);
      }
    }
    store.dispatch(bundleActions.removeBundle(bid));
  }
}

let swUnsubscribe: (() => void) | null = null;

export const vertoMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const s = store as unknown as StoreApi;

  if (setSession.match(action)) {
    const state = s.getState();
    const session = state.session;

    if (session.useVerto) {
      const vertoUrl = session.vertoUrl || env.VERTO_URL || '/verto';
      if (session.userName) {
        connectVerto(s, vertoUrl, session.userName);
      }
    } else {
      store.dispatch(vertoActions.setConnectionState('disconnected'));
      if (import.meta.env.DEV) console.log('[Verto] Skipped — user chose another device');
    }

    if (!swUnsubscribe) {
      swUnsubscribe = onServiceWorkerAction((msg) => {
        if (!msg.callID) return;
        const useVerto = s.getState().session.useVerto;
        if (!useVerto) return; // нет кнопок в этом режиме
        const call = s.getState().verto.calls[msg.callID];
        if (!call || call.direction !== 'inbound') return;
        if (msg.action === 'accept' && call.remoteSdp) {
          void answerInboundCall(msg.callID, call.remoteSdp, s.dispatch);
        } else if (msg.action === 'reject') {
          void rejectInboundCall(msg.callID, s.dispatch, s.getState);
        }
      });
    }
  }

  if (clearSession.match(action)) {
    disconnectVerto(s);
    if (swUnsubscribe) {
      swUnsubscribe();
      swUnsubscribe = null;
    }
  }

  return result;
};

async function connectVerto(
  store: StoreApi,
  vertoUrl: string,
  _userName: string,
) {
  store.dispatch(vertoActions.setConnectionState('connecting'));

  let wsUrl = vertoUrl;
  if (!wsUrl.startsWith('ws')) {
    wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${vertoUrl}`;
  }

  vertoClient.setHandlers({
    onReady: () => {
      store.dispatch(vertoActions.setConnectionState('connected'));
      if (import.meta.env.DEV) console.log('[Verto] Connected and ready');
    },

    onDisconnect: () => {
      store.dispatch(vertoActions.setConnectionState('disconnected'));
      destroyAllSessions();
      stopRingtone();
    },

    onCallCreated: (call: VertoCall) => {
      store.dispatch(vertoActions.addCall({
        callID: call.callID,
        direction: call.direction,
        destinationNumber: call.destinationNumber,
        callerIdName: call.callerIdName,
        callerIdNumber: call.callerIdNumber,
        state: call.state,
        startedAt: Date.now(),
        remoteSdp: call.remoteSdp ?? '',
      }));

      if (call.direction === 'inbound' && call.remoteSdp) {
        startRingtone(store.getState);
        const canAnswer = store.getState().session.useVerto === true;
        void showIncomingCallNotification({
          callID: call.callID,
          name: call.callerIdName,
          number: call.callerIdNumber,
          canAnswer,
        });
      }
    },

    onCallState: (callID: string, callState, _params) => {
      const prev = store.getState().verto.calls[callID];
      const wasInboundUnanswered = prev?.direction === 'inbound' && !prev?.answeredAt;
      store.dispatch(vertoActions.updateCallState({ callID, state: callState }));

      if (callState === 'active') {
        stopRingtone();
        closeIncomingNotification(callID);
      }

      if (callState === 'hangup' || callState === 'destroy') {
        stopRingtone();
        playEndSound();
        if (wasInboundUnanswered && hasActiveIncoming(callID)) {
          void showMissedCallNotification({
            callID,
            name: prev?.callerIdName ?? '',
            number: prev?.callerIdNumber ?? '',
          });
        }
        closeIncomingNotification(callID);
        destroySession(callID);
        hangupAllBundles(store);
        setTimeout(() => {
          store.dispatch(vertoActions.removeCall(callID));
        }, 2000);
      }
    },

    onCallMedia: (callID: string, sdp: string) => {
      setRemoteAnswer(callID, sdp)
        .then(() => {
          const call = store.getState().verto.calls[callID];
          if (call && call.state !== 'active') {
            store.dispatch(vertoActions.updateCallState({ callID, state: 'early' }));
          }
        })
        .catch((err) => {
          console.error('[Verto] Failed to set remote SDP:', err);
        });
    },

    onCallDisplay: (callID: string, displayName: string, displayNumber: string) => {
      store.dispatch(vertoActions.updateCallDisplay({ callID, displayName, displayNumber }));
    },

    onCallRedirect: (callID, info) => {
      store.dispatch(vertoActions.updateCallRedirect({ callID, ...info }));
    },
  });

  const creds = getVertoCredentials();
  if (!creds) {
    console.error('[Verto] No credentials available for Verto login');
    store.dispatch(vertoActions.setConnectionState('error'));
    return;
  }

  const vertoLogin = creds.login.includes('@') ? creds.login : `${creds.login}@default`;

  try {
    await vertoClient.connect(wsUrl, vertoLogin, creds.password);
  } catch (err) {
    console.error('[Verto] Connection failed:', err);
    store.dispatch(vertoActions.setConnectionState('error'));
  }
}

function disconnectVerto(store: StoreApi) {
  vertoClient.disconnect();
  destroyAllSessions();
  stopRingtone();
  store.dispatch(vertoActions.clearAll());
  clearVertoCredentials();
}

export async function answerInboundCall(
  callID: string,
  remoteSdp: string,
  dispatch: (a: unknown) => unknown,
) {
  try {
    const { answerSdp } = await createInboundSession(callID, remoteSdp);
    await vertoClient.answer(callID, answerSdp);
    dispatch(vertoActions.updateCallState({ callID, state: 'active' }));
    stopRingtone();
  } catch (err) {
    console.error('[Verto] Failed to answer incoming call:', err);
    destroySession(callID);
    dispatch(vertoActions.removeCall(callID));
    stopRingtone();
  }
}

export async function rejectInboundCall(
  callID: string,
  dispatch: (a: unknown) => unknown,
  getState?: () => RootState,
) {
  try {
    await vertoClient.bye(callID);
  } catch { /* ignore */ }
  destroySession(callID);
  dispatch(vertoActions.updateCallState({ callID, state: 'hangup' }));
  stopRingtone();

  if (getState) {
    const { ids, entities } = getState().bundle;
    for (const bid of ids) {
      const b = entities[bid];
      if (b) {
        const callServices = b.services.filter((s: BundleService) => s.type === 'Call');
        for (const svc of callServices) {
          dispatch(callApi.endpoints.hangupCall.initiate({ callId: svc.id }) as unknown as ReturnType<typeof bundleActions.removeBundle>);
        }
      }
      dispatch(bundleActions.removeBundle(bid));
    }
  }

  setTimeout(() => {
    dispatch(vertoActions.removeCall(callID));
  }, 1000);
}


export function saveVertoCredentials(login: string, password: string) {
  try {
    sessionStorage.setItem('_verto_creds', JSON.stringify({ login, password }));
  } catch { /* ignore */ }
}

function getVertoCredentials(): { login: string; password: string } | null {
  try {
    const raw = sessionStorage.getItem('_verto_creds');
    if (!raw) return null;
    return JSON.parse(raw) as { login: string; password: string };
  } catch {
    return null;
  }
}

function clearVertoCredentials() {
  try {
    sessionStorage.removeItem('_verto_creds');
  } catch { /* ignore */ }
}

