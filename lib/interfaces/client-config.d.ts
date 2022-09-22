import { XanoResponseType } from "../enums/response-type";
export interface XanoClientConfig {
    apiGroupBaseUrl: string | null;
    authToken?: string | null;
    responseType?: XanoResponseType;
}
