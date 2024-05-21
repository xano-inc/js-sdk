import { ERealtimeAction } from "../enums/realtime-action";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";

export class XanoRealtimeState {
  private static _instance = new XanoRealtimeState();

  private config: XanoClientConfig;
  private socket: WebSocket | null = null;

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

    if (!this.config.realtimeConnectionHash) {
      throw new Error(
        "Please configure realtimeConnectionHash setting before connecting to realtime"
      );
    }

    const url = new URL(
      `${this.config.instanceBaseUrl || this.config.apiGroupBaseUrl}`
    );

    let protocols;
    if (this.config.authToken) {
      protocols = [this.config.authToken];
    }

    this.socket = new WebSocket(
      `wss://${url.hostname}/rt/${this.config.realtimeConnectionHash}`,
      protocols
    );

    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.action) {
          this.socketObserver.notify({
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
