import { ERealtimeAction } from "../enums/realtime-action";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { ERealtimePresenceAction } from "../enums/realtime-presence-action.enum";
import { Observable } from "./observable";
import { Observer } from "./observer";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";
import { XanoRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { XanoRealtimeClient } from "./realtime-client";
import { XanoRealtimeState } from "./realtime-state";
import { realtimeBuildActionUtil } from "../utils/realtime-build-action.util";

export class XanoRealtimeChannel {
  private observed: boolean = false;
  private offlineMessageQueue: string[] = [];
  private presenceCache: XanoRealtimeClient[] = [];
  private socketObserver: Observable<XanoRealtimeAction> =
    XanoRealtimeState.getInstance().setConfig(this.config).getSocketObserver();

  private onFuncs: {
    action?: ERealtimeAction;
    onError?: CallableFunction;
    onFunc: CallableFunction;
  }[] = [];

  private realtimeObserver =
    new (class XanoRealtimeObserver extends Observer<XanoRealtimeAction> {
      constructor(private realtimeChannel: XanoRealtimeChannel) {
        super();
      }

      update(action: XanoRealtimeAction) {
        const channel = action?.options?.channel;
        if (channel && channel !== this.realtimeChannel.channel) {
          return;
        }

        switch (action.action) {
          case ERealtimeAction.ConnectionStatus:
            this.realtimeChannel.handleConnectionUpdate(action);
            this.realtimeChannel.processOfflineMessageQueue();
            break;
          case ERealtimeAction.PresenceFull:
          case ERealtimeAction.PresenceUpdate:
            this.realtimeChannel.handlePresenceUpdate(action);
            break;
        }

        for (const onFunc of this.realtimeChannel.onFuncs) {
          if (onFunc.action && onFunc.action !== action.action) {
            continue;
          }

          if (action.action === ERealtimeAction.Error) {
            if (onFunc.onError) {
              onFunc.onError(action);
            }
          } else {
            onFunc.onFunc(action);
          }
        }
      }
    })(this);

  constructor(
    public readonly channel: string,
    public readonly options: Partial<XanoRealtimeChannelOptions>,
    private readonly config: XanoClientConfig
  ) {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const action: XanoRealtimeAction = {
      action: ERealtimeAction.ConnectionStatus,
      options: {},
      payload: {
        status: ERealtimeConnectionStatus.Connected,
      },
    };

    for (const onFunc of this.onFuncs) {
      if (onFunc.action && onFunc.action !== action.action) {
        continue;
      }

      onFunc.onFunc(action);
    }

    this.handleConnectionUpdate(action);
  }

  private handleConnectionUpdate(action: XanoRealtimeAction): void {
    if (action.payload.status !== ERealtimeConnectionStatus.Connected) {
      return;
    }

    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildActionUtil(
      ERealtimeAction.Join,
      {
        channel: this.channel,
      },
      {
        presence: this.options.presence || false,
      }
    );

    socket.send(message);
  }

  private handlePresenceUpdate(action: XanoRealtimeAction): void {
    if (action.action === ERealtimeAction.PresenceFull) {
      this.presenceCache = action.payload.presence.map(
        (client) => new XanoRealtimeClient(client, this)
      );
    } else if (action.action === ERealtimeAction.PresenceUpdate) {
      if (action.payload.action === ERealtimePresenceAction.Join) {
        this.presenceCache.push(
          new XanoRealtimeClient(action.payload.presence, this)
        );
      } else if (action.payload.action === ERealtimePresenceAction.Leave) {
        this.presenceCache = this.presenceCache.filter(
          (item) => item.socketId !== action.payload.presence.socketId
        );
      }
    }
  }

  on(
    action: ERealtimeAction,
    onFunc: CallableFunction,
    onError?: CallableFunction
  ): XanoRealtimeChannel;

  on(onFunc: CallableFunction, onError?: CallableFunction): XanoRealtimeChannel;

  on(...args): XanoRealtimeChannel {
    if (!this.observed) {
      this.socketObserver.addObserver(this.realtimeObserver, true);
      this.observed = true;
    }

    if (typeof args[0] === "string") {
      this.onFuncs.push({
        action: <ERealtimeAction>args[0],
        onError: args[2],
        onFunc: args[1],
      });
    } else {
      this.onFuncs.push({ onFunc: args[0], onError: args[1] });
    }

    return this;
  }

  destroy(): void {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket !== null) {
      const message = realtimeBuildActionUtil(ERealtimeAction.Leave, {
        channel: this.channel,
      });

      socket.send(message);
    }

    this.socketObserver.removeObserver(this.realtimeObserver);
  }

  message(
    payload: any,
    actionOptions: Partial<XanoRealtimeActionOptions> = {}
  ) {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildActionUtil(
      ERealtimeAction.Message,
      { ...actionOptions, channel: this.channel },
      payload
    );

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else if (this.options.queueOfflineActions) {
      this.offlineMessageQueue.push(message);
    }
  }

  private processOfflineMessageQueue(): void {
    if (!this.options.queueOfflineActions) {
      return;
    }

    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    while (this.offlineMessageQueue.length) {
      const message = this.offlineMessageQueue.shift();
      if (message) {
        socket.send(message);
      }
    }
  }

  getPresence(): XanoRealtimeClient[] {
    return this.presenceCache;
  }
}
