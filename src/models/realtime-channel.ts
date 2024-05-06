import { ERealtimeCommand } from "../enums/realtime-command";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { ERealtimePresenceAction } from "../enums/realtime-presence-action.enum";
import { Observable } from "./observable";
import { Observer } from "./observer";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { XanoRealtimeClient } from "./realtime-client";
import { XanoRealtimeCommand } from "../interfaces/realtime-command";
import { XanoRealtimeCommandOptions } from "../interfaces/realtime-command-options";
import { XanoRealtimeState } from "./realtime-state";
import { realtimeBuildCommandUtil } from "../utils/realtime-build-message.util";

export class XanoRealtimeChannel {
  private observed: boolean = false;
  private offlineMessageQueue: string[] = [];
  private presenceCache: XanoRealtimeClient[] = [];
  private socketObserver: Observable<XanoRealtimeCommand> =
    XanoRealtimeState.getInstance().setConfig(this.config).getSocketObserver();

  private onFuncs: {
    onFunc: CallableFunction;
    onError?: CallableFunction;
  }[] = [];

  private realtimeObserver =
    new (class XanoRealtimeObserver extends Observer<XanoRealtimeCommand> {
      constructor(private realtimeChannel: XanoRealtimeChannel) {
        super();
      }

      update(command: XanoRealtimeCommand) {
        const channel = command?.commandOptions?.channel;
        if (channel && channel !== this.realtimeChannel.channel) {
          return;
        }

        switch (command.command) {
          case ERealtimeCommand.ConnectionStatus:
            this.realtimeChannel.handleConnectionUpdate(command);
            this.realtimeChannel.processOfflineMessageQueue();
            break;
          case ERealtimeCommand.PresenceFull:
          case ERealtimeCommand.PresenceUpdate:
            this.realtimeChannel.handlePresenceUpdate(command);
            break;
        }

        for (const onFunc of this.realtimeChannel.onFuncs) {
          if (command.command === ERealtimeCommand.Error) {
            if (onFunc.onError) {
              onFunc.onError(command);
            }
          } else {
            onFunc.onFunc(command);
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

    const command: XanoRealtimeCommand = {
      command: ERealtimeCommand.ConnectionStatus,
      commandOptions: {},
      payload: {
        status: ERealtimeConnectionStatus.Connected,
      },
    };

    for (const onFunc of this.onFuncs) {
      onFunc.onFunc(command);
    }

    this.handleConnectionUpdate(command);
  }

  private handleConnectionUpdate(command: XanoRealtimeCommand): void {
    if (command.payload.status !== ERealtimeConnectionStatus.Connected) {
      return;
    }

    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildCommandUtil(
      ERealtimeCommand.Join,
      {
        channel: this.channel,
      },
      {
        presence: this.options.presence || false,
      }
    );

    socket.send(message);
  }

  private handlePresenceUpdate(command: XanoRealtimeCommand): void {
    if (command.command === ERealtimeCommand.PresenceFull) {
      this.presenceCache = command.payload.presence.map(
        (client) => new XanoRealtimeClient(client, this)
      );
    } else if (command.command === ERealtimeCommand.PresenceUpdate) {
      if (command.payload.action === ERealtimePresenceAction.Join) {
        this.presenceCache.push(
          new XanoRealtimeClient(command.payload.presence, this)
        );
      } else if (command.payload.action === ERealtimePresenceAction.Leave) {
        this.presenceCache = this.presenceCache.filter(
          (item) => item.socketId !== command.payload.presence.socketId
        );
      }
    }
  }

  on(
    onFunc: CallableFunction,
    onError?: CallableFunction
  ): XanoRealtimeChannel {
    if (!this.observed) {
      this.socketObserver.addObserver(this.realtimeObserver, true);
      this.observed = true;
    }

    this.onFuncs.push({ onFunc, onError });

    return this;
  }

  destroy(): void {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket !== null) {
      const message = realtimeBuildCommandUtil(ERealtimeCommand.Leave, {
        channel: this.channel,
      });

      socket.send(message);
    }

    this.socketObserver.removeObserver(this.realtimeObserver);
  }

  message(
    payload: any,
    commandOptions: Partial<XanoRealtimeCommandOptions> = {}
  ) {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildCommandUtil(
      ERealtimeCommand.Message,
      { ...commandOptions, channel: this.channel },
      payload
    );

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else if (this.options.queueOfflineCommands) {
      this.offlineMessageQueue.push(message);
    }
  }

  private processOfflineMessageQueue(): void {
    if (!this.options.queueOfflineCommands) {
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
