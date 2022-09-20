import { XanoClientConfig } from "./interfaces/client-config";
import { XanoRequestError } from "./errors/request";
import { XanoRequestParams } from "./interfaces/request-params";
import { XanoRequestType } from "./enums/request-type";
import { XanoResponse } from "./models/response";
import { XanoResponseType } from "./enums/response-type";

export class XanoClient {
    private config: Partial<XanoClientConfig> = {
        responseType: XanoResponseType.Default
    };

    constructor(config: XanoClientConfig) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    private isAuthenticated(): boolean {
        return typeof this.config?.authBearerToken === 'string' && this.config.authBearerToken.length > 0;
    }

    private updateUrlWithParams(url: URL, params: Record<any, any>): void {
        let urlParams = new URLSearchParams(url.search);

        Object.keys(params).forEach((index) => {
            urlParams.set(index, params[index]);
        });

        url.search = urlParams.toString();
    }

    private request(params: XanoRequestParams): Promise<XanoResponse> {
        const url = new URL(`${this.config.apiGroupBaseUrl}${params.endpoint}`);
        const requestHeaders: HeadersInit = new Headers();

        if (params.urlParams) {
            this.updateUrlWithParams(url, params.urlParams)
        }

        if (this.isAuthenticated()) {
            requestHeaders.set('Authentication', `Bearer ${this.config.authBearerToken}`);
        }

        if (this.config.responseType === XanoResponseType.Text) {
            requestHeaders.set('Content-Type', 'text/plain');
        } else if (this.config.responseType === XanoResponseType.JSON) {
            requestHeaders.set('Content-Type', 'application/json');
        }

        let requestOptions: Partial<RequestInit> = {
            method: params.method,
            headers: requestHeaders
        }

        if (params.bodyParams) {

        }

        let rawResponse: Response;

        return fetch(url.toString(), requestOptions).then(
            (response: Response) => {
                rawResponse = response;

                switch (this.config.responseType) {
                    case XanoResponseType.Text: return response.text();
                    case XanoResponseType.JSON: return response.json();
                }
            }
        ).then(
            (data: any) => {
                const response = new XanoResponse(rawResponse, data);

                if (!rawResponse.ok) {
                    throw new XanoRequestError('There was an error with your request', response)
                }

                return response;
            }
        );
    }

    public setAuthBearerToken(bearerToken: string | null): XanoClient {
        this.config.authBearerToken = bearerToken;

        return this;
    }

    public setResponseType(responseType: XanoResponseType): XanoClient {
        this.config.responseType = responseType;

        return this;
    }

    public get(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            method: XanoRequestType.GET,
            endpoint: endpoint,
            urlParams: params
        });
    }

    public post(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            method: XanoRequestType.POST,
            endpoint: endpoint,
            bodyParams: params
        });
    }
}
