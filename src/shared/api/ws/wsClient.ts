
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
  if (typeof msg.type !== 'string') return null;

  if ('payload' in msg) return { type: msg.type, payload: msg.payload };
  if ('data' in msg) return { type: msg.type, payload: msg.data };
  if ('elements' in msg) return { type: msg.type, payload: msg.elements };

  const { type, ...rest } = msg;
  return { type, payload: rest };
}

export type WsHandler = (event: WsEvent, raw: WsRawMessage) => void;

const RECONNECT_MIN_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<WsHandler>();
  private url: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_MIN_DELAY;
  private intentionalClose = false;

  connect(url: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.url = url;
    this.intentionalClose = false;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.url) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectDelay = RECONNECT_MIN_DELAY;
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
      if (!this.intentionalClose && this.url) {
        this.scheduleReconnect();
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

  disconnect(): void {
    this.intentionalClose = true;
    this.url = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (!this.ws) return;
    this.ws.close();
    this.ws = null;
  }

  subscribe(handler: WsHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createWsClient(): WsClient {
  return new WsClient();
}

export const wsClient = createWsClient();
