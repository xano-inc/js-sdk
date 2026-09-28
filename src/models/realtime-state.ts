import { ERealtimeAction } from "../enums/realtime-action";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";

export class XanoRealtimeState {
  private static _instance = new XanoRealtimeState();

  /**
   * Wait before the next v2 readiness ping after a "not ready" answer. For the
   * first second after the socket opens it is 100ms, so the usual handshake
   * (a few hundred ms) is noticed within 100ms of ending. After that it doubles
   * up to 1s, so a tier that stays busy for seconds is asked once a second
   * rather than ten times.
   */
  private static readonly READY_PROBE_MIN_MS = 100;
  private static readonly READY_PROBE_FAST_FOR_MS = 1000;
  private static readonly READY_PROBE_MAX_MS = 1000;
  /**
   * The v2 tier's refusal of a frame that arrived before it finished
   * authenticating the socket. It carries no channel.
   */
  private static readonly NOT_READY = "Connection is not ready";
  private static readonly PING = "ping";
  private static readonly PONG = "pong";

  private config: XanoClientConfig;
  private socket: WebSocket | null = null;
  /** The socket the tier has confirmed it accepts frames on; see isReady(). */
  private readySocket: WebSocket | null = null;
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

  /**
   * True when a frame sent on the current socket will be processed.
   *
   * v1 processes frames as soon as the socket opens. v2 does not: after the
   * socket opens, the tier authenticates it (building an app and running the
   * server's `connect` trigger), and it refuses every frame that arrives before
   * that finishes with a "Connection is not ready" error. The refused frame is
   * dropped, not queued. That window has no fixed length (about 150ms on an
   * idle tier, several seconds on a busy one), so on v2 the socket counts as
   * ready only once a readiness ping has been answered with `pong` (see
   * connect()). The tier answers `ping` only after the socket is
   * authenticated, and a socket never goes back to unauthenticated, so
   * anything sent after that is processed.
   *
   * Every frame a v2 channel sends goes through this check, so while a v2
   * socket is not ready, the readiness pings are the only frames on it.
   */
  isReady(): boolean {
    const socket = this.socket;
    return (
      socket !== null &&
      socket === this.readySocket &&
      socket.readyState === WebSocket.OPEN
    );
  }

  /** An error about the connection rather than a channel: it names none. */
  private static isConnectionError(frame: any): boolean {
    return (
      frame?.action === ERealtimeAction.Error &&
      frame.channel === undefined &&
      frame.options?.channel === undefined
    );
  }

  private static isNotReadyRefusal(frame: any): boolean {
    return frame?.payload?.message === XanoRealtimeState.NOT_READY;
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
    //
    // Read once per socket and used again at open: every channel constructor
    // calls setConfig(), so a second client with another realtimeVersion could
    // otherwise send v2 readiness pings to the v1 tier, which never answers.
    const v2 = this.isV2();
    const path = v2 ? "ws" : "rt";
    const canonical =
      this.config.realtimeConnectionCanonical ||
      this.config.realtimeConnectionHash;

    const socket = new WebSocket(
      `wss://${url.hostname}/${path}/${canonical}`,
      protocols
    );
    this.socket = socket;

    // v2 readiness check for THIS socket (see isReady()). Frames are told
    // apart by what they are, never by pairing them with a ping: the tier can
    // also send a frame nobody asked for (a refused handshake sends its reason,
    // then closes), and pairing that with a ping in flight misfiles the ping's
    // own answer. Only the SDK pings, so every pong answers one of its pings;
    // and before the socket is ready the SDK sends nothing else, so a not-ready
    // refusal then is always the answer to one.
    let pingTimer: ReturnType<typeof setTimeout> | null = null;
    let openedAt = 0;
    let pingBackoff = XanoRealtimeState.READY_PROBE_MIN_MS;

    const nextPingDelay = (): number => {
      if (Date.now() - openedAt < XanoRealtimeState.READY_PROBE_FAST_FOR_MS) {
        return XanoRealtimeState.READY_PROBE_MIN_MS;
      }

      pingBackoff = Math.min(
        2 * pingBackoff,
        XanoRealtimeState.READY_PROBE_MAX_MS
      );
      return pingBackoff;
    };

    const markReady = () => {
      this.readySocket = socket;
      this.socketObserver.notify({
        action: ERealtimeAction.ConnectionStatus,
        options: {},
        payload: {
          status: ERealtimeConnectionStatus.Connected,
        },
      });
    };

    const sendReadinessPing = () => {
      // Stale once the socket is closed or replaced, or already ready.
      if (
        this.socket !== socket ||
        this.readySocket === socket ||
        socket.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      socket.send(JSON.stringify({ action: XanoRealtimeState.PING }));
    };

    // At most one ping is waiting to go out.
    const schedulePing = () => {
      if (pingTimer !== null) {
        return;
      }

      pingTimer = setTimeout(() => {
        pingTimer = null;
        sendReadinessPing();
      }, nextPingDelay());
    };

    socket.addEventListener("message", (event) => {
      let becameReady = false;

      try {
        const data = JSON.parse(event.data);
        let passOn = true;
        const ready = this.readySocket === socket;

        if (v2 && data?.action === XanoRealtimeState.PONG) {
          // The first pong reports the socket ready. A later one answers a
          // ping that was still in flight, and one on a socket that has since
          // been replaced is stale; both are dropped.
          becameReady = !ready && this.socket === socket;
          passOn = false;
        } else if (v2 && !ready && XanoRealtimeState.isConnectionError(data)) {
          // Ping again after a pause. A not-ready refusal answers a ping and is
          // not the app's business. Any other connection-level error reaches
          // the app; pinging again also covers a ping that such an error
          // answered, which would otherwise wait forever. (After a refused
          // handshake the socket closes, and the ping never goes out.)
          schedulePing();
          passOn = !XanoRealtimeState.isNotReadyRefusal(data);
        }

        if (passOn && data?.action) {
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

      // Outside the try, as v1's `connected` is announced from the open
      // listener: an error thrown by an app's connection_status handler must
      // surface rather than vanish into the catch above.
      if (becameReady) {
        markReady();
      }
    });

    socket.addEventListener("close", (e: CloseEvent) => {
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

    socket.addEventListener("open", () => {
      this.reconnectSettings.reconnecting = false;
      this.reconnectSettings.reconnectInterval =
        this.reconnectSettings.defaultReconnectInterval;

      // `connected` means "frames sent now will be processed", which is what
      // makes the channels send their joins. On v1 that is true at open. On v2
      // it is announced when the tier answers a readiness ping, which is also
      // what the app's connection_status handler sees.
      if (v2) {
        openedAt = Date.now();
        sendReadinessPing();
        return;
      }

      markReady();
    });

    return socket;
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
