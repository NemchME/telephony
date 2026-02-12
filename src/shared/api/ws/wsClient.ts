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

  if ('payload' in msg) return { type: msg.type, payload: (msg as any).payload };
  if ('data' in msg) return { type: msg.type, payload: (msg as any).data };
  if ('elements' in msg) return { type: msg.type, payload: (msg as any).elements };

  const { type, ...rest } = msg;
  return { type, payload: rest };
}

export type WsHandler = (event: WsEvent, raw: WsRawMessage) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<WsHandler>();

  connect(url: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(url);

    this.ws.onmessage = (e: MessageEvent<string>) => {
      const parsed = safeParseJson(e.data);
      const raw: WsRawMessage = typeof parsed === 'string' ? parsed : (parsed as WsRawMessage);

      const evt = toWsEvent(raw);
      if (!evt) return;

      this.handlers.forEach((h) => h(evt, raw));
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnect(): void {
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