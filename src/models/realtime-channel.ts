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
  /**
   * The tier's refusal for a frame that beat the handshake. Matched as a
   * substring because it arrives as a plain error frame with no code.
   */
  private static readonly JOIN_NOT_READY = "Connection is not ready";

  private observed: boolean = false;
  private offlineMessageQueue: string[] = [];
  private presenceCache: XanoRealtimeClient[] = [];
  /** Cleared on every disconnect so a reconnect re-proves the join landed. */
  private joinAcknowledged: boolean = false;
  /**
   * The join awaiting acknowledgement, retained so a refusal can re-send it.
   * Null whenever there is nothing outstanding to retry.
   */
  private pendingJoin: { message: string; attempt: number } | null = null;
  // NOT `setConfig(this.config)`: a field initializer runs BEFORE the
  // constructor body assigns its parameter properties, so `this.config` is
  // still undefined here and that call wiped the state's config. Every
  // config-derived decision then read undefined -- `isV2()` answered false on a
  // v2 client, so the join omitted `client_id` (silently breaking resume) and
  // the v2-only join retry never armed. The constructor sets the config itself,
  // after the parameter properties exist.
  private socketObserver: Observable<XanoRealtimeAction> =
    XanoRealtimeState.getInstance().getSocketObserver();

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
          case ERealtimeAction.Error:
            // The `auth_pending` refusal is the ONLY signal that a join needs
            // re-sending, so it drives the retry. Handed on to the app's error
            // handlers below either way.
            this.realtimeChannel.handleJoinRefused(action);
            break;
          case ERealtimeAction.PresenceFull:
          case ERealtimeAction.PresenceUpdate:
          case ERealtimeAction.PresenceJoin:
          case ERealtimeAction.PresenceLeave:
            this.realtimeChannel.handlePresenceUpdate(action);
            break;
        }

        // An async handler returns a promise the moment it hits its first
        // await, so "the loop finished" does NOT mean the work finished.
        // Acking there would report a message durably handled while the write
        // it depends on is still in flight -- and a crash in that window loses
        // the message with the cursor already advanced past it. Collect
        // whatever the handlers return and let autoAck wait on it.
        const pending: Promise<unknown>[] = [];

        for (const onFunc of this.realtimeChannel.onFuncs) {
          if (onFunc.action && onFunc.action !== action.action) {
            continue;
          }

          if (action.action === ERealtimeAction.Error) {
            if (onFunc.onError) {
              onFunc.onError(action);
            }
          } else {
            // A synchronous throw propagates, exactly as it did before
            // auto-ack existed -- the loop stops and the app sees the error.
            // autoAck is never reached, so the cursor stays put and the message
            // is redelivered, which is the outcome we want anyway.
            const returned = onFunc.onFunc(action);
            if (returned && typeof returned.then === "function") {
              pending.push(returned);
            }
          }
        }

        // Advance the durable cursor once the handlers have actually finished.
        // Doing it here rather than making the app call ack() removes the other
        // silent-failure step: forgetting to ack does not break anything
        // visibly, it just makes every reconnect replay the whole retained
        // window. A handler that throws -- or whose promise rejects -- leaves
        // the cursor unadvanced, so the message is redelivered.
        this.realtimeChannel.autoAck(action, pending);
      }
    })(this);

  constructor(
    public readonly channel: string,
    public readonly options: Partial<XanoRealtimeChannelOptions>,
    private readonly config: XanoClientConfig
  ) {
    // Must happen here rather than in a field initializer -- see socketObserver
    // above. Everything below, and every later config read (isV2, client_id),
    // depends on this having run.
    const state = XanoRealtimeState.getInstance().setConfig(this.config);

    const socket = state.getSocket();
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
    this.pendingJoin = null;
  }

  private handleConnectionUpdate(action: XanoRealtimeAction): void {
    if (action.payload.status !== ERealtimeConnectionStatus.Connected) {
      // A dropped socket joins nothing, so the next Connected must re-prove the
      // join rather than trusting the previous connection's acknowledgement.
      // The outstanding join dies with the socket it was sent on; the next
      // Connected issues a fresh one.
      this.joinAcknowledged = false;
      this.pendingJoin = null;
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
   * Send the join, re-sending only if the v2 tier explicitly REFUSES it.
   *
   * A v2 handshake builds an ApplicationContext AFTER the socket opens, and any
   * frame arriving before that is refused with "Connection is not ready" — the
   * `auth_pending` guard. The refusal is a normal error frame, not a close, so
   * an un-retried join is simply LOST and the channel stays silently unjoined:
   * the socket looks healthy while no messages ever arrive. That is most likely
   * precisely on the reconnect path, where the app is not there to re-issue it.
   *
   * The retry is driven by that refusal and NOT by a timer, because the tier
   * exposes no ready signal and the handshake has no bounded duration — its own
   * harness simply sleeps 900ms before sending anything. A timer shorter than
   * the handshake re-sends a join that was merely in flight, and a duplicate
   * join is expensive rather than idempotent: it re-runs the channel's join
   * trigger, re-sends the presence snapshot, re-fires presence_join, and
   * replays the conversation transcript and the at-least-once gap a second time
   * — straight into the app's message handler, with no `replayed` marker to
   * filter the duplicates by. Waiting for the refusal costs nothing on the
   * happy path and cannot duplicate a join that the tier accepted.
   *
   * v1 has no such guard, so this only retries for v2.
   */
  private sendJoin(socket: WebSocket, message: string, attempt = 0): void {
    const state = XanoRealtimeState.getInstance();

    if (!state.isV2() || attempt >= XanoRealtimeChannel.JOIN_MAX_ATTEMPTS) {
      this.pendingJoin = null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
      return;
    }

    // Re-read the live socket each attempt: a reconnect in flight replaces it,
    // and sending on the previous one would go nowhere.
    const current = state.getSocket();
    if (current === null) {
      this.pendingJoin = null;
      return;
    }

    // Not open YET is the one case a timer is still right for: there is no
    // frame to be refused, so nothing else can wake us.
    if (current.readyState !== WebSocket.OPEN) {
      this.pendingJoin = { message, attempt };
      setTimeout(
        () => this.retryJoinIfUnacknowledged(socket, message, attempt),
        XanoRealtimeChannel.JOIN_RETRY_MS
      );
      return;
    }

    // Retained so an incoming refusal knows what to re-send, and cleared as
    // soon as the tier acknowledges the join.
    this.pendingJoin = { message, attempt };
    current.send(message);
  }

  /**
   * Re-send a join the tier refused with the `auth_pending` guard.
   *
   * Ignores any other error frame: a refused join is the only error this can
   * fix, and re-sending on e.g. an authorization failure would just repeat it.
   */
  private handleJoinRefused(action: XanoRealtimeAction): void {
    const pending = this.pendingJoin;
    if (pending === null || this.joinAcknowledged) {
      return;
    }

    const message = action?.payload?.message;
    if (
      typeof message !== "string" ||
      !message.includes(XanoRealtimeChannel.JOIN_NOT_READY)
    ) {
      return;
    }

    const socket = XanoRealtimeState.getInstance().getSocket();
    if (socket === null) {
      return;
    }

    this.retryJoinIfUnacknowledged(socket, pending.message, pending.attempt);
  }

  private retryJoinIfUnacknowledged(
    socket: WebSocket,
    message: string,
    attempt: number
  ): void {
    if (this.joinAcknowledged) {
      this.pendingJoin = null;
      return;
    }

    this.sendJoin(socket, message, attempt + 1);
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
      // Remove exactly ONE member. The tier identifies an anonymous member as
      // `id: "0"` for everyone (its anonymous identity has `row_id => 0`), and
      // re-stamps `joined_at` at leave time, so a leave frame carries nothing
      // that distinguishes one anonymous member from another. A filter over the
      // whole roster therefore emptied it on the first departure. Dropping a
      // single match keeps the COUNT right, which is what a roster is mostly
      // used for; identifying WHICH anonymous member left needs a stable
      // per-member key from the tier and cannot be fixed here.
      const index = this.presenceCache.findIndex((item) =>
        this.isSameMember(item, gone)
      );

      if (index !== -1) {
        this.presenceCache.splice(index, 1);
      }

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

    if (!state.isV2()) {
      const message = realtimeBuildActionUtil(
        ERealtimeAction.Message,
        { ...actionOptions, channel: this.channel },
        payload
      );

      this.sendOrQueue(socket, message);
      return;
    }

    // A per-call type overrides the channel default. It is pulled OUT of the
    // options rather than passed through: the tier reads `$frame['type']` only,
    // so a type left nested in options routes nowhere and comes back as
    // `Unknown message type: ` — an error naming the empty string rather than
    // the type the caller actually asked for.
    const { type: perCallType, ...restOptions } = actionOptions;
    const messageType = perCallType ?? this.options.messageType;

    // Fail here rather than letting the tier answer with that same empty-string
    // error, which names neither the channel nor the missing setting.
    if (!messageType) {
      throw new Error(
        `Realtime v2 channel "${this.channel}" requires a message type. Set \`messageType\` on the channel, or pass \`{ type }\` to message().`
      );
    }

    const message = realtimeBuildActionUtil(
      ERealtimeAction.Broadcast,
      { ...restOptions, channel: this.channel },
      payload,
      messageType
    );

    this.sendOrQueue(socket, message);
  }

  private sendOrQueue(socket: WebSocket, message: string): void {

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else if (this.options.queueOfflineActions) {
      this.offlineMessageQueue.push(message);
    }
  }

  /**
   * Acknowledge a delivered message automatically, unless the app opted out.
   *
   * Waits for anything the handlers returned, so an `async` handler is acked
   * when its work COMPLETES rather than when it first awaits. A handler that
   * throws, or whose promise rejects, leaves the cursor unadvanced and the
   * message is redelivered on the next resumed join -- which is the behaviour
   * an at_least_once channel is chosen for.
   */
  private autoAck(
    action: XanoRealtimeAction,
    pending: Promise<unknown>[] = []
  ): void {
    if (this.options.manualAck) {
      return;
    }

    if (action.action !== ERealtimeAction.Message || !action.id) {
      return;
    }

    const cursor = action.id;

    if (pending.length === 0) {
      this.ack(cursor);
      return;
    }

    // `all` rather than `allSettled`: one failed handler means this message is
    // not fully handled, so it must stay unacked and be redelivered. The catch
    // keeps that from surfacing as an unhandled rejection -- the app already
    // saw its own error.
    Promise.all(pending).then(
      () => this.ack(cursor),
      () => undefined
    );
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

    // The tier resolves the acknowledged stream id at FRAME level -- top-level
    // `id`, falling back to `options.id`. It never looks inside `payload`, and
    // an unresolved id is not an error: the handler returns before touching
    // Redis, so the ack simply evaporates and the cursor never moves. The
    // visible symptom is a reconnect that replays the entire retained stream
    // every time, which reads as a replay bug rather than an ack one.
    //
    // Note the tier's own CONFIRMATION frame echoes `payload.cursor` back --
    // the reply shape is not the request shape, which is what makes sending
    // the cursor in the payload look right.
    socket.send(
      realtimeBuildActionUtil(
        ERealtimeAction.Ack,
        { channel: this.channel, client_id: state.getClientId(), id: cursor },
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

  /**
   * Request the channel's message history (v1 only).
   *
   * v2 has no `history` action: the frame falls through to the generic trigger
   * dispatch, throws, and comes back as `Internal error` — a server-side error
   * for a client-side mistake. So this no-ops there, the mirror image of
   * `ack()` no-opping on v1. v2's equivalent is the join-time transcript
   * replay, enabled by the channel's `history` option.
   */
  history(): void {
    const state = XanoRealtimeState.getInstance();
    if (state.isV2()) {
      return;
    }

    const socket = state.getSocket();
    if (socket === null) {
      return;
    }

    const message = realtimeBuildActionUtil(ERealtimeAction.History, {
      channel: this.channel,
    });

    socket.send(message);
  }
}
