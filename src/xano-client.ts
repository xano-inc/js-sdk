import { ClientConfig } from "./interfaces/client-config";
import { RequestParams } from "./interfaces/request-params";
import { RequestType } from "./enums/request-type";
import { ResponseType } from "./enums/response-type";

export class XanoClient {
    private config: Partial<ClientConfig> = {
        responseType: ResponseType.Default
    };

    constructor(config: ClientConfig) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    private isAuthenticated(): boolean {
        return typeof this.config.authBearerToken === 'string' && this.config.authBearerToken.length > 0;
    }

    private request(params: RequestParams): Promise<any> {
        return fetch(`${this.config.apiGroupBaseUrl}${params.endpoint}`, {
            method: params.method
        }).then(
            (response) => {
                if (!response.ok) {
                    throw new Error(response.statusText)
                }

                return response.json() as Promise<any>;
            }
        );
    }

    public setAuthBearerToken(bearerToken: string | null): XanoClient {
        this.config.authBearerToken = bearerToken;

        return this;
    }

    public setResponseType(responseType: ResponseType): XanoClient {
        this.config.responseType = responseType;

        return this;
    }

    public get(endpoint: string, params: Record<any, any>): Promise<any> {
        return this.request({
            method: RequestType.GET,
            endpoint: endpoint,
            urlParams: params
        });
    }
}