
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
import { env } from '@/app/config/env';

let ringtoneCtx: AudioContext | null = null;
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

function startRingtone() {
  stopRingtone();
  try {
    ringtoneCtx = new AudioContext();
    function playRingBurst() {
      if (!ringtoneCtx) return;
      const now = ringtoneCtx.currentTime;
      const osc1 = ringtoneCtx.createOscillator();
      const osc2 = ringtoneCtx.createOscillator();
      const gain = ringtoneCtx.createGain();
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;
      gain.gain.value = 0.15;
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ringtoneCtx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1);
      osc2.stop(now + 1);
    }
    playRingBurst();
    ringtoneInterval = setInterval(playRingBurst, 3000);
  } catch { /* ignore */ }
}

function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (ringtoneCtx) {
    ringtoneCtx.close().catch(() => {});
    ringtoneCtx = null;
  }
}

function playEndSound() {
  try {
    const enabled = localStorage.getItem('settings.endCallSound') !== 'false';
    if (!enabled) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 480;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch { /* ignore */ }
}

type StoreApi = {
  dispatch: (a: unknown) => unknown;
  getState: () => RootState;
};

export const vertoMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const s = store as unknown as StoreApi;

  if (setSession.match(action)) {
    const state = s.getState();
    const session = state.session;

    const vertoUrl = session.vertoUrl || env.VERTO_URL || '/verto';
    if (session.userName) {
      connectVerto(s, vertoUrl, session.userName);
    }
  }

  if (clearSession.match(action)) {
    disconnectVerto(s);
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
        remoteSdp: call.remoteSdp,
      }));

      if (call.direction === 'inbound' && call.remoteSdp) {
        startRingtone();
      }
    },

    onCallState: (callID: string, callState, _params) => {
      store.dispatch(vertoActions.updateCallState({ callID, state: callState }));

      if (callState === 'active') {
        stopRingtone();
      }

      if (callState === 'hangup' || callState === 'destroy') {
        stopRingtone();
        playEndSound();
        destroySession(callID);
        setTimeout(() => {
          store.dispatch(vertoActions.removeCall(callID));
        }, 2000);
      }
    },

    onCallMedia: (callID: string, sdp: string) => {
      setRemoteAnswer(callID, sdp)
        .then(() => {
          const call = s.getState().verto.calls[callID];
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
) {
  try {
    await vertoClient.bye(callID);
  } catch { /* ignore */ }
  destroySession(callID);
  dispatch(vertoActions.updateCallState({ callID, state: 'hangup' }));
  stopRingtone();
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

