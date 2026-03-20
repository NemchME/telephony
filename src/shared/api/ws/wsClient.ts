
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type WsRawMessage = JsonValue | Record<string, unknown> | string;

export type WsEvent = {
  type: string;
  payload?: unknown;
};

function toWsEvent(msg: WsRawMessage): WsEvent | null {
  if (typeof msg === 'string') return { type: msg };

  if (!isRecord(msg)) return null;

  const type = typeof msg.type === 'string' ? msg.type
    : typeof msg.method === 'string' ? msg.method
    : null;
  if (!type) return null;

  if ('payload' in msg) return { type, payload: msg.payload };
  if ('data' in msg) return { type, payload: msg.data };
  if ('elements' in msg) return { type, payload: msg.elements };

  const { type: _t, method: _m, eventTimeSec: _ts, ...rest } = msg;
  return { type, payload: rest };
}

export type WsHandler = (event: WsEvent, raw: WsRawMessage) => void;

export type WsConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type WsStateListener = (state: WsConnectionState) => void;

const RECONNECT_MIN_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const HEARTBEAT_INTERVAL = 30000;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<WsHandler>();
  private stateListeners = new Set<WsStateListener>();
  private url: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = RECONNECT_MIN_DELAY;
  private intentionalClose = false;
  private _state: WsConnectionState = 'disconnected';

  connect(url: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.url = url;
    this.intentionalClose = false;
    this.setState('connecting');
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.url) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectDelay = RECONNECT_MIN_DELAY;
      this.setState('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (e: MessageEvent<string>) => {
      const parsed = safeParseJson(e.data);
      const raw: WsRawMessage = typeof parsed === 'string' ? parsed : (parsed as WsRawMessage);

      const evt = toWsEvent(raw);
      if (!evt) return;

      this.handlers.forEach((h) => h(evt, raw));
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.stopHeartbeat();
      if (!this.intentionalClose && this.url) {
        this.setState('reconnecting');
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = () => {
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_DELAY);
      this.doConnect();
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ method: 'Heartbeat' }));
        } catch {
          // ошибка
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setState(newState: WsConnectionState): void {
    if (this._state === newState) return;
    this._state = newState;
    this.stateListeners.forEach((l) => l(newState));
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.url = null;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (!this.ws) {
      this.setState('disconnected');
      return;
    }
    this.ws.close();
    this.ws = null;
    this.setState('disconnected');
  }

  subscribe(handler: WsHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStateChange(listener: WsStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  get connectionState(): WsConnectionState {
    return this._state;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createWsClient(): WsClient {
  return new WsClient();
}

export const wsClient = createWsClient();
