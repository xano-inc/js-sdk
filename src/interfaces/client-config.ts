import { ResponseType } from "../enums/response-type";

export interface ClientConfig {
    apiGroupBaseUrl: string;
    authBearerToken?: string;
    responseType?: ResponseType;
}