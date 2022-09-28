import { XanoBaseStorage } from '../models/base-storage';

export interface XanoClientConfig {
    apiGroupBaseUrl: string | null;
    authToken?: string | null;
    responseObjectPrefix?: string | null;
    storage: XanoBaseStorage;
}
