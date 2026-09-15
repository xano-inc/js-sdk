import { ERealtimeAction } from "../enums/realtime-action";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";

export class XanoRealtimeState {
  private static _instance = new XanoRealtimeState();

  private config: XanoClientConfig;
  private socket: WebSocket | null = null;
  private generatedClientId: string | null = null;

  private reconnectSettings = {
    defaultReconnectInterval: 1000,
    reconnectInterval: 1000,
    reconnecting: false,
  };

  private socketObserver = new Observable<XanoRealtimeAction>(
    (count: number) => {
      if (count) {
        this.connect();
      } else {
        this.disconnect();
      }
    }
  );

  constructor() {
    if (XanoRealtimeState._instance) {
      throw new Error(
        "Instantiation failed: Use XanoRealtimeState.getInstance() instead of new."
      );
    }

    XanoRealtimeState._instance = this;
  }

  static getInstance(): XanoRealtimeState {
    return XanoRealtimeState._instance;
  }

  /** True when this client is configured for the v2 (OpenSwoole) tier. */
  isV2(): boolean {
    return this.config?.realtimeVersion === 2;
  }

  /**
   * The stable client id a resumed join is keyed on (v2 only).
   *
   * It must be identical across a reconnect or the server treats the returning
   * client as a new one and replays nothing, so it is generated ONCE per
   * process and cached — never derived from the socket, whose fd is recycled.
   * An explicit `realtimeClientId` wins, which is how an app can persist one
   * across page loads (localStorage) and resume a gap spanning a reload.
   */
  getClientId(): string {
    if (this.config?.realtimeClientId) {
      return this.config.realtimeClientId;
    }

    if (!this.generatedClientId) {
      const rand = Math.random().toString(36).slice(2, 10);
      this.generatedClientId = `xano-${Date.now().toString(36)}-${rand}`;
    }

    return this.generatedClientId;
  }

  private triggerReconnect(): void {
    setTimeout(() => {
      this.connect();
    }, this.reconnectSettings.reconnectInterval);

    this.reconnectSettings.reconnectInterval = Math.min(
      2 * this.reconnectSettings.reconnectInterval,
      60000
    );
  }

  private connect(): WebSocket | null {
    if (this.socket) {
      return this.socket;
    }

    if (!this.config.instanceBaseUrl && !this.config.apiGroupBaseUrl) {
      throw new Error(
        "Please configure instanceBaseUrl or apiGroupBaseUrl setting before connecting to realtime"
      );
    }

    if (!this.config.realtimeConnectionCanonical && !this.config.realtimeConnectionHash) {
      throw new Error(
        "Please configure realtimeConnectionCanonical setting before connecting to realtime"
      );
    }

    const url = new URL(
      `${this.config.instanceBaseUrl || this.config.apiGroupBaseUrl}`
    );

    let protocols;

    if (this.config.realtimeAuthToken) {
      protocols = [this.config.realtimeAuthToken];
    }

    // v1 and v2 are separate services reached on different paths: `/rt/` is the
    // legacy NestJS tier, `/ws/` the OpenSwoole one. The ingress strips the
    // prefix before the tier sees it, so the canonical is all that reaches the
    // server in both cases.
    const path = this.isV2() ? "ws" : "rt";
    const canonical =
      this.config.realtimeConnectionCanonical ||
      this.config.realtimeConnectionHash;

    this.socket = new WebSocket(
      `wss://${url.hostname}/${path}/${canonical}`,
      protocols
    );

    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.action) {
          // Spread the frame rather than hand-copying four known fields: v2
          // carries `channel`, `type` and the stream `id` at the TOP level, and
          // a field-by-field copy silently dropped all three -- which left the
          // channel filter with nothing to match on and made auto-ack a no-op,
          // since it keys on `id`. The explicit fields below still normalise
          // the v1 shape.
          this.socketObserver.notify({
            ...data,
            action: data.action,
            client: data?.client || undefined,
            options: data?.options || undefined,
            payload: data.payload,
          });
        }
      } catch (e) {
        // Silent
      }
    });

    this.socket.addEventListener("close", (e: CloseEvent) => {
      if (!this.socket) {
        if (this.reconnectSettings.reconnecting) {
          this.triggerReconnect();
        }

        return;
      }

      this.socket = null;

      this.socketObserver.notify({
        action: ERealtimeAction.ConnectionStatus,
        options: {},
        payload: {
          status: ERealtimeConnectionStatus.Disconnected,
        },
      });

      const reconnectCodes = [
        1006, // Abnormal Closure
        1011, // Internal Error
        1012, // Service Restart
        1013, // Try Again Later
        1014, // Bad Gateway
        4000, // Internal: Reconnect
      ];

      if (reconnectCodes.includes(e.code)) {
        this.reconnectSettings.reconnecting = true;
        this.triggerReconnect();
      }
    });

    this.socket.addEventListener("open", () => {
      this.reconnectSettings.reconnecting = false;
      this.reconnectSettings.reconnectInterval =
        this.reconnectSettings.defaultReconnectInterval;

      this.socketObserver.notify({
        action: ERealtimeAction.ConnectionStatus,
        options: {},
        payload: {
          status: ERealtimeConnectionStatus.Connected,
        },
      });
    });

    return this.socket;
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.close(1000);
      this.socket = null;
    }
  }

  reconnect(): void {
    this.socket?.close(4000);
  }

  getSocket(): WebSocket | null {
    return this.socket;
  }

  setConfig(config: XanoClientConfig): this {
    this.config = config;
    return this;
  }

  getSocketObserver(): Observable<XanoRealtimeAction> {
    return this.socketObserver;
  }
}
