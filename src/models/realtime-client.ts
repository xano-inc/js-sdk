import { ERealtimeCommand } from "../enums/realtime-command";
import { XanoRealtimeChannel } from "./realtime-channel";
import { XanoRealtimeClient as IXanoRealtimeClient } from "../interfaces/realtime-client";
import { XanoRealtimeState } from "./realtime-state";
import { realtimeBuildCommandUtil } from "../utils/realtime-build-message.util";

export class XanoRealtimeClient implements IXanoRealtimeClient {
  private readonly channel: XanoRealtimeChannel;

  extras: Record<string, any>;
  permissions: {
    dbo_id: number;
    row_id: number;
  };
  socketId: string;

  constructor(client: IXanoRealtimeClient, channel: XanoRealtimeChannel) {
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
