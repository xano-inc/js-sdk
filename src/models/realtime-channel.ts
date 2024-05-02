import { ERealtimeCommand } from "../enums/realtime-command";
import { ERealtimeConnectionStatus } from "../enums/realtime-connection-status";
import { ERealtimePresenceAction } from "../enums/realtime-presence-action.enum";
import { IRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { IRealtimeCommand } from "../interfaces/realtime-command";
import { IRealtimeCommandOptions } from "../interfaces/realtime-command-options";
import { Observable } from "./observable";
import { Observer } from "./observer";
import { RealtimeClient } from "./realtime-client";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeState } from "./realtime-state";
import { realtimeBuildCommandUtil } from "../utils/realtime-build-message.util";

export class XanoRealtimeChannel {
  private observed: boolean = false;
  private presenceCache: RealtimeClient[] = [];
  private socketObserver: Observable<IRealtimeCommand> =
    XanoRealtimeState.getInstance().setConfig(this.config).getSocketObserver();

  private onFuncs: {
    onFunc: CallableFunction;
    onError?: CallableFunction;
  }[] = [];

  private realtimeObserver =
    new (class XanoRealtimeObserver extends Observer<IRealtimeCommand> {
      constructor(private realtimeChannel: XanoRealtimeChannel) {
        super();
      }

      update(command: IRealtimeCommand) {
        const channel = command?.commandOptions?.channel;
        if (channel && channel !== this.realtimeChannel.channel) {
          return;
        }

        switch (command.command) {
          case ERealtimeCommand.ConnectionStatus:
            this.realtimeChannel.handleConnectionUpdate(command);
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
    public readonly options: Partial<IRealtimeChannelOptions>,
    private readonly config: XanoClientConfig
  ) {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const command: IRealtimeCommand = {
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

  private handleConnectionUpdate(command: IRealtimeCommand): void {
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

  private handlePresenceUpdate(command: IRealtimeCommand): void {
    if (command.command === ERealtimeCommand.PresenceFull) {
      this.presenceCache = command.payload.presence.map(
        (client) => new RealtimeClient(client, this)
      );
    } else if (command.command === ERealtimeCommand.PresenceUpdate) {
      if (command.payload.action === ERealtimePresenceAction.Join) {
        this.presenceCache.push(
          new RealtimeClient(command.payload.presence, this)
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

  message(payload: any, commandOptions: Partial<IRealtimeCommandOptions> = {}) {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildCommandUtil(
      ERealtimeCommand.Message,
      { ...commandOptions, channel: this.channel },
      payload
    );

    socket.send(message);
  }

  getPresence(): RealtimeClient[] {
    return this.presenceCache;
  }
}
