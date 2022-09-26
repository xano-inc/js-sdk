import { XanoStorage } from '../models/storage';

export interface XanoClientConfig {
    apiGroupBaseUrl: string | null;
    authToken?: string | null;
    storage: XanoStorage;
}
