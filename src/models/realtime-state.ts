import { ERealtimeCommand } from "../enums/realtime-command";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { IRealtimeCommand } from "../interfaces/realtime-command";
import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";

export class XanoRealtimeState {
  private static _instance = new XanoRealtimeState();

  private config: XanoClientConfig;
  private socket: WebSocket | null = null;

  private reconnectSettings = {
    reconnectInterval: 1000,
  };

  private socketObserver = new Observable<IRealtimeCommand>((count: number) => {
    if (count) {
      this.connect();
    } else {
      this.disconnect();
    }
  });

  constructor() {
    if (XanoRealtimeState._instance) {
      throw new Error(
        "Error: Instantiation failed: Use XanoRealtimeState.getInstance() instead of new."
      );
    }

    XanoRealtimeState._instance = this;
  }

  static getInstance(): XanoRealtimeState {
    return XanoRealtimeState._instance;
  }

  private connect(): WebSocket | null {
    if (this.socket) {
      return this.socket;
    }

    if (!this.config.realtimeConnectionHash) {
      throw new Error(
        "Error: Please configure realtimeConnectionHash setting before connecting to realtime"
      );
    }

    const url = new URL(`${this.config.apiGroupBaseUrl}`);

    let protocols;
    if (this.config.authToken) {
      protocols = [this.config.authToken];
    }

    let domain = `wss://${url.hostname}`;
    if (this.config.realtimeConnectionUrlOverride) {
      domain = this.config.realtimeConnectionUrlOverride;
    }

    this.socket = new WebSocket(
      `${domain}/rt/${this.config.realtimeConnectionHash}`,
      protocols
    );

    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.command) {
          this.socketObserver.notify({
            client: data?.client || undefined,
            command: data.command,
            commandOptions: data?.commandOptions || undefined,
            payload: data.payload,
          });
        }
      } catch (e) {
        // Silent
      }
    });

    this.socket.addEventListener("error", () => {
      if (!this.socket) {
        return;
      }

      this.socket = null;

      this.socketObserver.notify({
        command: ERealtimeCommand.ConnectionStatus,
        commandOptions: {},
        payload: {
          status: ERealtimeConnectionStatus.Disconnected,
        },
      });

      setTimeout(() => {
        this.connect();
      }, this.reconnectSettings.reconnectInterval);

      this.reconnectSettings.reconnectInterval = Math.min(
        2 * this.reconnectSettings.reconnectInterval,
        60000
      );
    });

    this.socket.addEventListener("close", () => {
      if (!this.socket) {
        return;
      }

      this.socket = null;

      this.socketObserver.notify({
        command: ERealtimeCommand.ConnectionStatus,
        commandOptions: {},
        payload: {
          status: ERealtimeConnectionStatus.Disconnected,
        },
      });
    });

    this.socket.addEventListener("open", () => {
      this.socketObserver.notify({
        command: ERealtimeCommand.ConnectionStatus,
        commandOptions: {},
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

  getSocketObserver(): Observable<IRealtimeCommand> {
    return this.socketObserver;
  }
}
