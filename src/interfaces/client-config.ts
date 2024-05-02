import { AxiosRequestConfig } from "axios";
import { XanoBaseStorage } from "../models/base-storage";

export interface XanoClientConfig {
  apiGroupBaseUrl: string | null;
  authToken?: string | null;
  customAxiosRequestConfig?: Partial<AxiosRequestConfig>;
  dataSource?: string | null;
  realtimeConnectionHash?: string | null;
  realtimeConnectionUrlOverride?: string | null;
  responseObjectPrefix?: string | null;
  storage: XanoBaseStorage;
}
