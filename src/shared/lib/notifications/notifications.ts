let swRegistration: ServiceWorkerRegistration | null = null;
let permissionRequested = false;

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[SW] register failed:', err);
  }
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  if (permissionRequested) return Notification.permission;
  permissionRequested = true;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function show(
  title: string,
  options: NotificationOptions & { data?: Record<string, unknown> },
): Promise<void> {
  const perm = await ensureNotificationPermission();
  if (perm !== 'granted') return;
  try {
    if (swRegistration) {
      await swRegistration.showNotification(title, options);
    } else {

      new Notification(title, options);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Notify] showNotification failed:', err);
  }
}

const ACTIVE_INCOMING: Map<string, true> = new Map();

export async function showIncomingCallNotification(opts: {
  callID: string;
  name: string;
  number: string;
  canAnswer: boolean;
  url?: string;
}): Promise<void> {
  ACTIVE_INCOMING.set(opts.callID, true);
  const actions = opts.canAnswer
    ? [
        { action: 'accept', title: 'Принять' },
        { action: 'reject', title: 'Отклонить' },
      ]
    : [];

  await show('Входящий вызов', {
    body: [opts.name, opts.number].filter(Boolean).join(' • '),
    tag: `incoming:${opts.callID}`,
    requireInteraction: true,
    icon: '/favicons/favicon.ico',
    data: {
      kind: 'incoming',
      callID: opts.callID,
      url: opts.url ?? location.origin + '/',
    },

    ...(actions.length ? { actions } : {}),
  } as NotificationOptions & { actions?: { action: string; title: string }[] });
}

export async function showMissedCallNotification(opts: {
  callID?: string;
  name: string;
  number: string;
  url?: string;
}): Promise<void> {
  if (opts.callID) ACTIVE_INCOMING.delete(opts.callID);
  await show('Пропущенный вызов', {
    body: [opts.name, opts.number].filter(Boolean).join(' • '),
    tag: opts.callID ? `missed:${opts.callID}` : 'missed',
    icon: '/favicons/favicon_unavail.ico',
    data: {
      kind: 'missed',
      callID: opts.callID ?? null,
      url: opts.url ?? location.origin + '/',
    },
  });
}

export function closeIncomingNotification(callID: string) {
  ACTIVE_INCOMING.delete(callID);
  if (!swRegistration) return;
  swRegistration.getNotifications({ tag: `incoming:${callID}` }).then((list) => {
    for (const n of list) n.close();
  }).catch(() => { /* ignore */ });
}

export function hasActiveIncoming(callID: string): boolean {
  return ACTIVE_INCOMING.has(callID);
}

export type SwAction = { source: 'phone-sw'; action: string; callID: string | null };

export function onServiceWorkerAction(handler: (msg: SwAction) => void): () => void {
  if (!('serviceWorker' in navigator)) return () => {};
  const listener = (event: MessageEvent) => {
    const data = event.data;
    if (data && data.source === 'phone-sw') {
      handler(data as SwAction);
    }
  };
  navigator.serviceWorker.addEventListener('message', listener);
  return () => navigator.serviceWorker.removeEventListener('message', listener);
}