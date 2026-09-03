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
  /** Retry budget for a join refused by the v2 auth_pending guard. */
  private static readonly JOIN_MAX_ATTEMPTS = 5;
  private static readonly JOIN_RETRY_MS = 400;

  private observed: boolean = false;
  private offlineMessageQueue: string[] = [];
  private presenceCache: XanoRealtimeClient[] = [];
  /** Cleared on every disconnect so a reconnect re-proves the join landed. */
  private joinAcknowledged: boolean = false;
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

      update(rawAction: XanoRealtimeAction) {
        // v1 addresses a frame with `options.channel`; v2 puts `channel` at the
        // top level. Reading both is what lets one observer serve either tier —
        // checking only options.channel would pass every v2 frame to every
        // channel, since the field is simply absent there.
        const channel = rawAction?.options?.channel ?? rawAction?.channel;
        if (channel && channel !== this.realtimeChannel.channel) {
          return;
        }

        // A `replay` is the same message the app already knows how to handle,
        // redelivered because it was missed while offline. Surfacing it as its
        // own action would force every app to register a second handler with
        // logic identical to its `message` one -- and the failure mode of
        // forgetting is silent and rare: messages vanish only for users who
        // happen to reconnect across a gap. So it is normalised to `message`
        // carrying `replayed: true`, which follows the tier's OWN precedent for
        // conversation-transcript replay (delivered as `message` with
        // `conversation: true`, not as a distinct action). An app that wants to
        // treat a replay differently branches on the marker.
        const action =
          rawAction.action === ERealtimeAction.Replay
            ? { ...rawAction, action: ERealtimeAction.Message, replayed: true }
            : rawAction;

        switch (action.action) {
          case ERealtimeAction.ConnectionStatus:
            this.realtimeChannel.handleConnectionUpdate(action);
            this.realtimeChannel.processOfflineMessageQueue();
            break;
          case ERealtimeAction.Join:
            // The tier's own confirmation that this channel is joined; it is
            // what stops the join retry above.
            this.realtimeChannel.markJoinAcknowledged();
            break;
          case ERealtimeAction.PresenceFull:
          case ERealtimeAction.PresenceUpdate:
          case ERealtimeAction.PresenceJoin:
          case ERealtimeAction.PresenceLeave:
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

        // Advance the durable cursor once the handlers have seen the message.
        // Doing it here rather than making the app call ack() removes the other
        // silent-failure step: forgetting to ack does not break anything
        // visibly, it just makes every reconnect replay the whole retained
        // window. Deliberately AFTER the handler loop, so a handler that throws
        // leaves the cursor unadvanced and the message is redelivered.
        this.realtimeChannel.autoAck(action);
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

  /** The tier confirmed this channel is joined; stops the join retry. */
  private markJoinAcknowledged(): void {
    this.joinAcknowledged = true;
  }

  private handleConnectionUpdate(action: XanoRealtimeAction): void {
    if (action.payload.status !== ERealtimeConnectionStatus.Connected) {
      // A dropped socket joins nothing, so the next Connected must re-prove the
      // join rather than trusting the previous connection's acknowledgement.
      this.joinAcknowledged = false;
      return;
    }

    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const state = XanoRealtimeState.getInstance();

    // This runs on EVERY transition to Connected, including the one after an
    // automatic reconnect — which is what re-joins the channel without the app
    // doing anything. On v2 the join carries the stable client_id, so the
    // server can recognise the returning client and replay the gap it missed
    // (it answers `resumed: true` plus `replay` frames). Omit the id and a
    // reconnect silently becomes a fresh join with no backlog.
    const options: XanoRealtimeActionOptions = { channel: this.channel };

    if (state.isV2()) {
      options.client_id = state.getClientId();
    }

    const message = realtimeBuildActionUtil(ERealtimeAction.Join, options, {
      history: this.options.history || false,
      presence: this.options.presence || false,
    });

    this.sendJoin(socket, message);
  }

  /**
   * Send the join, retrying briefly if the v2 tier is not ready for it yet.
   *
   * A v2 handshake builds an ApplicationContext AFTER the socket opens, and any
   * frame arriving before that is refused with "Connection is not ready" — the
   * `auth_pending` guard. The refusal is a normal error frame, not a close, so
   * an un-retried join is simply LOST and the channel stays silently unjoined:
   * the socket looks healthy while no messages ever arrive. That is most likely
   * precisely on the reconnect path, where the app is not there to re-issue it.
   *
   * v1 has no such guard, so this only retries for v2.
   */
  private sendJoin(socket: WebSocket, message: string, attempt = 0): void {
    const state = XanoRealtimeState.getInstance();

    if (!state.isV2() || attempt >= XanoRealtimeChannel.JOIN_MAX_ATTEMPTS) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
      return;
    }

    // Re-read the live socket each attempt: a reconnect in flight replaces it,
    // and sending on the previous one would go nowhere.
    const current = state.getSocket();
    if (current === null) {
      return;
    }

    if (current.readyState !== WebSocket.OPEN) {
      setTimeout(
        () => this.sendJoin(socket, message, attempt + 1),
        XanoRealtimeChannel.JOIN_RETRY_MS
      );
      return;
    }

    current.send(message);

    // The tier answers a refused join with an error frame rather than closing,
    // so confirm the join landed and re-send if it did not.
    setTimeout(() => {
      if (!this.joinAcknowledged && attempt + 1 < XanoRealtimeChannel.JOIN_MAX_ATTEMPTS) {
        this.sendJoin(socket, message, attempt + 1);
      }
    }, XanoRealtimeChannel.JOIN_RETRY_MS);
  }

  private handlePresenceUpdate(action: XanoRealtimeAction): void {
    // The roster arrives as `payload.presence` on v1 and `payload.members` on
    // v2, and v2 splits the delta into its own presence_join / presence_leave
    // actions rather than an `action` discriminator inside the payload.
    if (action.action === ERealtimeAction.PresenceFull) {
      const roster = action.payload?.members ?? action.payload?.presence ?? [];
      this.presenceCache = roster.map(
        (client) => new XanoRealtimeClient(client, this)
      );
      return;
    }

    if (action.action === ERealtimeAction.PresenceJoin) {
      this.presenceCache.push(
        new XanoRealtimeClient(action.payload.member, this)
      );
      return;
    }

    if (action.action === ERealtimeAction.PresenceLeave) {
      const gone = action.payload?.member;
      this.presenceCache = this.presenceCache.filter(
        (item) => !this.isSameMember(item, gone)
      );
      return;
    }

    if (action.action === ERealtimeAction.PresenceUpdate) {
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

  /**
   * v2 members are refcounted per IDENTITY, not per socket, so a member has no
   * socketId to match on — two tabs of one user collapse to a single entry.
   * Fall back to socketId so this stays correct for a v1 roster too.
   */
  private isSameMember(item: any, gone: any): boolean {
    if (!gone) {
      return false;
    }

    if (gone.id !== undefined && item?.id !== undefined) {
      return String(item.id) === String(gone.id);
    }

    return item?.socketId === gone?.socketId;
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

    // v1 publishes with `message`; v2 publishes with `broadcast` and routes on
    // a top-level `type` naming the channel's message object. Delivery arrives
    // as `message` on both tiers, so this asymmetry is confined to the send.
    const state = XanoRealtimeState.getInstance();
    const message = state.isV2()
      ? realtimeBuildActionUtil(
          ERealtimeAction.Broadcast,
          { ...actionOptions, channel: this.channel },
          payload,
          this.options.messageType
        )
      : realtimeBuildActionUtil(
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

  /**
   * Acknowledge a delivered message automatically, unless the app opted out.
   *
   * A handler that throws propagates out of the observer before this runs, so
   * the cursor is not advanced and the tier redelivers on the next resumed
   * join -- which is the behaviour an at_least_once channel is chosen for.
   */
  private autoAck(action: XanoRealtimeAction): void {
    if (this.options.manualAck) {
      return;
    }

    if (action.action !== ERealtimeAction.Message || !action.id) {
      return;
    }

    this.ack(action.id);
  }

  /**
   * Advance this client's durable cursor on an `at_least_once` channel (v2).
   *
   * Called automatically for every delivered message, so an app only needs
   * this when it sets `manualAck` to defer acknowledgement past the handler --
   * e.g. until the message is persisted or a user has actually seen it.
   *
   * Only meaningful with a stable client_id: the cursor is stored against it,
   * and it is what bounds the replay after a resumed join.
   */
  ack(cursor: string): void {
    const state = XanoRealtimeState.getInstance();
    if (!state.isV2()) {
      return;
    }

    const socket = state.getSocket();
    if (socket === null || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      realtimeBuildActionUtil(
        ERealtimeAction.Ack,
        { channel: this.channel, client_id: state.getClientId() },
        { cursor }
      )
    );
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

  history(): void {
    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildActionUtil(ERealtimeAction.History, {
      channel: this.channel,
    });

    socket.send(message);
  }
}
