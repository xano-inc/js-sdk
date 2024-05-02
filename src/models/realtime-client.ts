import { ERealtimeCommand } from "../enums/realtime-command";
import { IRealtimeClient } from "../interfaces/realtime-client";
import { XanoRealtimeState } from "./realtime-state";
import { realtimeBuildCommandUtil } from "../utils/realtime-build-message.util";
import { XanoRealtimeChannel } from "./realtime-channel";

export class RealtimeClient implements IRealtimeClient {
  private readonly channel: XanoRealtimeChannel;

  extras: Record<string, any>;
  permissions: {
    dbo_id: number;
    row_id: number;
  };
  socketId: string;

  constructor(client: IRealtimeClient, channel: XanoRealtimeChannel) {
    Object.assign(this, client);
    this.channel = channel;
  }

  message(payload: any): void {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildCommandUtil(
      ERealtimeCommand.Message,
      {
        channel: this.channel.channel,
        socketId: this.socketId,
      },
      payload
    );

    socket.send(message);
  }
}
