export interface XanoRealtimeActionOptions {
    authenticated?: boolean;
    channel?: string;
    socketId?: string;
    /** v2: stable client identity a resumed join / cursor ack is keyed on. */
    client_id?: string;
    /**
     * v2: the channel message object this publish routes to, overriding the
     * channel's `messageType` for one call. Lifted to the top level of the frame
     * by `message()` — the tier reads it there and nowhere else.
     */
    type?: string;
    /**
     * v2: the acknowledged stream id on an `ack`.
     *
     * The tier resolves it at frame level (top-level `id`, then `options.id`) and
     * never reads the payload, so an ack that carries it only in the payload is
     * silently discarded.
     */
    id?: string;
}
//# sourceMappingURL=realtime-action-options.d.ts.map