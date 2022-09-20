import { XanoResponseType } from "../enums/response-type";

export interface XanoClientConfig {
    apiGroupBaseUrl: string;
    authBearerToken?: string;
    responseType?: XanoResponseType;
}