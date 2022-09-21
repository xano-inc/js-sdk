import { XanoResponseType } from "../enums/response-type";

export interface XanoClientConfig {
    apiGroupBaseUrl: string;
    authToken?: string;
    responseType?: XanoResponseType;
}
