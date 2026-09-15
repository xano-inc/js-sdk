import { AxiosRequestConfig } from "axios";
import { XanoBaseStorage } from "../models/base-storage";

export interface XanoClientConfig {
  apiGroupBaseUrl?: string | null;
  authToken?: string | null;
  customAxiosRequestConfig?: Partial<AxiosRequestConfig>;
  dataSource?: string | null;
  instanceBaseUrl?: string | null;
  realtimeAuthToken?: string | null;
  realtimeConnectionCanonical?: string | null;
  /** @deprecated Use realtimeConnectionCanonical instead */
  realtimeConnectionHash?: string | null;
  /**
   * Realtime protocol version. Defaults to 1 so existing apps are unaffected.
   *
   * A workspace is on v2 when it owns an enabled `realtime_server` row; the two
   * tiers are different services on different paths (`/rt/` vs `/ws/`) and must
   * never both serve one workspace, so this is a per-app setting rather than
   * something the client can negotiate.
   */
  realtimeVersion?: 1 | 2;
  /**
   * Stable per-client identifier, v2 only. It is what a resumed join is keyed
   * on, so it MUST survive a reconnect — otherwise the server cannot tell the
   * returning client from a new one and replays nothing. Generated and
   * persisted automatically when omitted.
   */
  realtimeClientId?: string | null;
  responseObjectPrefix?: string | null;
  storage: XanoBaseStorage;
}
