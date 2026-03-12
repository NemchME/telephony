

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  result?: Record<string, unknown>;
  error?: Record<string, unknown>;
  params?: Record<string, unknown>;
};

type PendingRequest = {
  resolve: (result: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export type VertoCallState = 'new' | 'trying' | 'ringing' | 'early' | 'active' | 'held' | 'hangup' | 'destroy';

export type VertoCall = {
  callID: string;
  direction: 'outbound' | 'inbound';
  destinationNumber: string;
  callerIdName: string;
  callerIdNumber: string;
  state: VertoCallState;
  remoteSdp?: string;
  localSdp?: string;
};

export type VertoEventHandler = {
  onCallCreated?: (call: VertoCall) => void;
  onCallState?: (callID: string, state: VertoCallState, params?: Record<string, unknown>) => void;
  onCallMedia?: (callID: string, sdp: string) => void;
  onCallDisplay?: (callID: string, displayName: string, displayNumber: string) => void;
  onReady?: () => void;
  onDisconnect?: () => void;
};

const RPC_TIMEOUT = 10_000;

export class VertoClient {
  private ws: WebSocket | null = null;
  private rpcId = Math.floor(Math.random() * 1_000_000);
  private pending = new Map<number, PendingRequest>();
  private sessid: string = '';
  private _connected = false;
  private handlers: VertoEventHandler = {};
  private _login = '';
  private _password = '';

  get connected() { return this._connected; }
  get sessionId() { return this.sessid; }

  setHandlers(h: VertoEventHandler) {
    this.handlers = h;
  }

  connect(url: string, login: string, password: string): Promise<void> {
    this._login = login;
    this._password = password;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Verto WS connection timeout'));
        this.disconnect();
      }, RPC_TIMEOUT);

      this.ws.onopen = async () => {
        clearTimeout(timeout);
        try {
          await this.doLogin(login, password);
          this._connected = true;
          this.handlers.onReady?.();
          resolve();
        } catch (err) {
          reject(err);
          this.disconnect();
        }
      };

      this.ws.onmessage = (e: MessageEvent<string>) => {
        this.handleMessage(e.data);
      };

      this.ws.onclose = () => {
        this._connected = false;
        this.cleanupPending();
        this.handlers.onDisconnect?.();
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
      };
    });
  }

  disconnect() {
    this._connected = false;
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    this.cleanupPending();
  }

  private cleanupPending() {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error('Connection closed'));
    }
    this.pending.clear();
  }

  private nextId(): number {
    return ++this.rpcId;
  }

  private send(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = this.nextId();
      const req: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Verto RPC timeout: ${method}`));
      }, RPC_TIMEOUT);

      this.pending.set(id, { resolve, reject, timer });

      if (import.meta.env.DEV) {
        console.debug('[Verto →]', method, params);
      }

      this.ws.send(JSON.stringify(req));
    });
  }

  private handleMessage(raw: string) {
    let msg: JsonRpcResponse;
    try {
      msg = JSON.parse(raw) as JsonRpcResponse;
    } catch {
      return;
    }

    if (import.meta.env.DEV) {
      console.debug('[Verto ←]', msg.method ?? `id:${msg.id}`, msg);
    }

    if (msg.id != null && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id)!;
      this.pending.delete(msg.id);
      clearTimeout(p.timer);

      if (msg.error) {
        p.reject(new Error(JSON.stringify(msg.error)));
      } else {
        p.resolve(msg.result ?? {});
      }
      return;
    }

    if (msg.method) {
      this.handleServerEvent(msg.method, msg.params ?? {}, msg.id);
    }
  }

  private handleServerEvent(method: string, params: Record<string, unknown>, id?: number) {
    switch (method) {
      case 'verto.media': {
        const dp = (params.dialogParams ?? params) as Record<string, unknown>;
        const callID = (dp.callID ?? params.callID) as string;
        const sdp = params.sdp as string;
        if (callID && sdp) {
          this.handlers.onCallMedia?.(callID, sdp);
        }
        if (id != null) this.sendResult(id, { method });
        break;
      }

      case 'verto.invite': {
        const dp = (params.dialogParams ?? params) as Record<string, unknown>;
        const callID = (dp.callID ?? params.callID) as string;
        const call: VertoCall = {
          callID,
          direction: 'inbound',
          destinationNumber: String(dp.destination_number ?? dp.callee_id_number ?? ''),
          callerIdName: String(dp.caller_id_name ?? ''),
          callerIdNumber: String(dp.caller_id_number ?? ''),
          state: 'ringing',
          remoteSdp: params.sdp as string,
        };
        this.handlers.onCallCreated?.(call);
        if (id != null) this.sendResult(id, { method });
        break;
      }

      case 'verto.answer': {
        const dp = (params.dialogParams ?? params) as Record<string, unknown>;
        const callID = (dp.callID ?? params.callID) as string;
        this.handlers.onCallState?.(callID, 'active', params);
        if (id != null) this.sendResult(id, { method });
        break;
      }

      case 'verto.bye': {
        const dp = (params.dialogParams ?? params) as Record<string, unknown>;
        const callID = (dp.callID ?? params.callID) as string;
        this.handlers.onCallState?.(callID, 'hangup', params);
        if (id != null) this.sendResult(id, { method });
        break;
      }

      case 'verto.display': {
        const dp = (params.dialogParams ?? params) as Record<string, unknown>;
        const callID = (dp.callID ?? params.callID) as string;
        const name = String(dp.display_name ?? dp.caller_id_name ?? '');
        const number = String(dp.display_number ?? dp.caller_id_number ?? '');
        this.handlers.onCallDisplay?.(callID, name, number);
        if (id != null) this.sendResult(id, { method });
        break;
      }

      case 'verto.punt': {
        this.disconnect();
        break;
      }

      case 'verto.clientReady': {
        if (id != null) this.sendResult(id, { method });
        break;
      }

      default: {
        if (id != null) this.sendResult(id, { method });
        break;
      }
    }
  }

  private sendResult(id: number, result: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ jsonrpc: '2.0', id, result }));
    }
  }


  private async doLogin(login: string, password: string): Promise<void> {
    this.sessid = crypto.randomUUID();
    const result = await this.send('login', {
      login,
      passwd: password,
      sessid: this.sessid,
    });
    if (result.message !== 'logged in') {
      throw new Error(`Verto login failed: ${JSON.stringify(result)}`);
    }
    this.sessid = (result.sessid as string) ?? this.sessid;
  }

  async invite(
    callID: string,
    destinationNumber: string,
    callerIdName: string,
    callerIdNumber: string,
    localSdp: string,
  ): Promise<{ callID: string }> {
    const dialogParams = {
      callID,
      destination_number: destinationNumber,
      caller_id_name: callerIdName,
      caller_id_number: callerIdNumber,
      incomingBandwidth: 'default',
      outgoingBandwidth: 'default',
      useStereo: false,
      useVideo: false,
      screenShare: false,
      dedEnc: false,
      audioParams: {},
      loginParams: {},
    };

    const result = await this.send('verto.invite', {
      sdp: localSdp,
      dialogParams,
      sessid: this.sessid,
    });

    return { callID: (result.callID as string) ?? callID };
  }

  async answer(callID: string, localSdp: string): Promise<void> {
    await this.send('verto.answer', {
      sdp: localSdp,
      dialogParams: { callID },
      sessid: this.sessid,
    });
  }

  async bye(callID: string): Promise<void> {
    try {
      await this.send('verto.bye', {
        dialogParams: { callID },
        sessid: this.sessid,
      });
    } catch {
    }
  }

  async hold(callID: string): Promise<void> {
    await this.send('verto.modify', {
      action: 'hold',
      dialogParams: { callID },
      sessid: this.sessid,
    });
  }

  async unhold(callID: string): Promise<void> {
    await this.send('verto.modify', {
      action: 'unhold',
      dialogParams: { callID },
      sessid: this.sessid,
    });
  }

  async dtmf(callID: string, digit: string): Promise<void> {
    await this.send('verto.info', {
      dtmf: digit,
      dialogParams: { callID },
      sessid: this.sessid,
    });
  }
}

export const vertoClient = new VertoClient();
