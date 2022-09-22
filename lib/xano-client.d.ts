import { XanoClientConfig } from "./interfaces/client-config";
import { XanoResponse } from "./models/response";
import { XanoResponseType } from "./enums/response-type";
export declare class XanoClient {
    private config;
    constructor(config: XanoClientConfig);
    private buildFormData;
    private hasAuthToken;
    private request;
    private updateUrlWithParams;
    setAuthToken(authToken: string | null): XanoClient;
    setResponseType(responseType: XanoResponseType): XanoClient;
    delete(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    get(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    head(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    patch(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    post(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    put(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
}
