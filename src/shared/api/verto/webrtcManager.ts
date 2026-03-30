

const DEFAULT_STUN = 'stun:stun.l.google.com:19302';

function getStunEnabled(): boolean {
  try {
    return localStorage.getItem('settings.stunEnabled') !== 'false';
  } catch {
    return true;
  }
}

function createPcConfig(): RTCConfiguration {
  const stunEnabled = getStunEnabled();
  return {
    iceServers: stunEnabled ? [{ urls: DEFAULT_STUN }] : [],
    bundlePolicy: 'max-compat',
  };
}

export type WebRtcCallSession = {
  pc: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
  remoteAudio: HTMLAudioElement;
  callID: string;
};

const activeSessions = new Map<string, WebRtcCallSession>();

function createRemoteAudioElement(): HTMLAudioElement {
  const audio = document.createElement('audio');
  audio.id = 'verto-remote-audio';
  audio.autoplay = true;
  audio.style.display = 'none';
  document.body.appendChild(audio);
  return audio;
}

export async function acquireMedia(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
}
export async function createOutboundSession(callID: string): Promise<{ session: WebRtcCallSession; offerSdp: string }> {
  const localStream = await acquireMedia();
  const pc = new RTCPeerConnection(createPcConfig());
  const remoteStream = new MediaStream();
  const remoteAudio = createRemoteAudioElement();

  for (const track of localStream.getAudioTracks()) {
    pc.addTrack(track, localStream);
  }
  pc.ontrack = (e) => {
    if (import.meta.env.DEV) {
      console.log('[WebRTC] ontrack', e.track.kind, e.streams.length, 'streams');
    }
    for (const stream of e.streams) {
      for (const track of stream.getTracks()) {
        remoteStream.addTrack(track);
      }
    }
    if (e.streams.length === 0) {
      remoteStream.addTrack(e.track);
    }
    remoteAudio.srcObject = remoteStream;
    remoteAudio.play().catch(() => { /* autoplay policy */ });
  };
  const offer = await pc.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
  });
  await pc.setLocalDescription(offer);

  const sdp = await waitForIceGathering(pc, 3000);

  const session: WebRtcCallSession = { pc, localStream, remoteStream, remoteAudio, callID };
  activeSessions.set(callID, session);

  return { session, offerSdp: sdp };
}

export async function createInboundSession(callID: string, remoteSdp: string): Promise<{ session: WebRtcCallSession; answerSdp: string }> {
  const localStream = await acquireMedia();
  const pc = new RTCPeerConnection(createPcConfig());
  const remoteStream = new MediaStream();
  const remoteAudio = createRemoteAudioElement();

  for (const track of localStream.getAudioTracks()) {
    pc.addTrack(track, localStream);
  }

  pc.ontrack = (e) => {
    if (import.meta.env.DEV) {
      console.log('[WebRTC] ontrack', e.track.kind, e.streams.length, 'streams');
    }
    for (const stream of e.streams) {
      for (const track of stream.getTracks()) {
        remoteStream.addTrack(track);
      }
    }
    if (e.streams.length === 0) {
      remoteStream.addTrack(e.track);
    }
    remoteAudio.srcObject = remoteStream;
    remoteAudio.play().catch(() => {});
  };

  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: remoteSdp }));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  const sdp = await waitForIceGathering(pc, 3000);

  const session: WebRtcCallSession = { pc, localStream, remoteStream, remoteAudio, callID };
  activeSessions.set(callID, session);

  return { session, answerSdp: sdp };
}

export async function setRemoteAnswer(callID: string, remoteSdp: string): Promise<void> {
  const session = activeSessions.get(callID);
  if (!session) throw new Error(`No session for callID ${callID}`);

  const signalingState = session.pc.signalingState;

  if (signalingState === 'have-local-offer') {
    await session.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: remoteSdp }));
  } else if (signalingState === 'stable') {
    await session.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: remoteSdp }));
    const answer = await session.pc.createAnswer();
    await session.pc.setLocalDescription(answer);
  } else {
    if (import.meta.env.DEV) {
      console.warn(`[WebRTC] setRemoteAnswer skipped, signalingState=${signalingState}`);
    }
    return;
  }

  if (!session.remoteAudio.srcObject) {
    session.remoteAudio.srcObject = session.remoteStream;
  }
  session.remoteAudio.play().catch(() => {});
}

export function destroySession(callID: string) {
  const session = activeSessions.get(callID);
  if (!session) return;

  for (const track of session.localStream.getTracks()) {
    track.stop();
  }

  session.remoteAudio.pause();
  session.remoteAudio.srcObject = null;
  session.remoteAudio.remove();

  try { session.pc.close(); } catch { /* ignore */ }

  activeSessions.delete(callID);
}

export function getSession(callID: string): WebRtcCallSession | undefined {
  return activeSessions.get(callID);
}

export function getActiveCallIDs(): string[] {
  return Array.from(activeSessions.keys());
}

export function toggleMute(callID: string): boolean {
  const session = activeSessions.get(callID);
  if (!session) return false;
  const audioTracks = session.localStream.getAudioTracks();
  const muted = audioTracks.length > 0 && audioTracks[0].enabled;
  for (const track of audioTracks) {
    track.enabled = !muted;
  }
  return muted; 
}

export function isMuted(callID: string): boolean {
  const session = activeSessions.get(callID);
  if (!session) return false;
  const audioTracks = session.localStream.getAudioTracks();
  return audioTracks.length > 0 && !audioTracks[0].enabled;
}

export function destroyAllSessions() {
  for (const callID of activeSessions.keys()) {
    destroySession(callID);
  }
}


function waitForIceGathering(pc: RTCPeerConnection, timeout: number): Promise<string> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve(pc.localDescription?.sdp ?? '');
      return;
    }

    const timer = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve(pc.localDescription?.sdp ?? '');
    }, timeout);

    function check() {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', check);
        resolve(pc.localDescription?.sdp ?? '');
      }
    }

    pc.addEventListener('icegatheringstatechange', check);
  });
}
