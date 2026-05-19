const LS_INPUT = 'settings.audio.inputDeviceId';
const LS_OUTPUT = 'settings.audio.outputDeviceId';

export function getInputDeviceId(): string | null {
  try { return localStorage.getItem(LS_INPUT); } catch { return null; }
}

export function setInputDeviceId(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_INPUT, id);
    else localStorage.removeItem(LS_INPUT);
  } catch { /* ignore */ }
}

export function getOutputDeviceId(): string | null {
  try { return localStorage.getItem(LS_OUTPUT); } catch { return null; }
}

export function setOutputDeviceId(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_OUTPUT, id);
    else localStorage.removeItem(LS_OUTPUT);
  } catch { /* ignore */ }
}

export function supportsSinkId(): boolean {
  try {
    return 'setSinkId' in HTMLMediaElement.prototype;
  } catch { return false; }
}

export async function applySinkId(el: HTMLMediaElement): Promise<void> {
  const id = getOutputDeviceId();
  if (!id || !supportsSinkId()) return;
  try {
    await (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(id);
  } catch {
    /* ignore */
  }
}

export async function listAudioDevices(): Promise<{
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { inputs: [], outputs: [] };
    }
    const all = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs: all.filter((d) => d.kind === 'audioinput'),
      outputs: all.filter((d) => d.kind === 'audiooutput'),
    };
  } catch {
    return { inputs: [], outputs: [] };
  }
}

export async function primeDeviceLabels(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of stream.getTracks()) t.stop();
  } catch { /* user denied */ }
}