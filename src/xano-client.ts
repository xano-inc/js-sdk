import { XanoClientConfig } from "./interfaces/client-config";
import { XanoContentType } from "./enums/content-type";
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

    private request(params: XanoRequestParams): Promise<XanoResponse> {
        const requestHeaders: HeadersInit = new Headers();
        const url = new URL(`${this.config.apiGroupBaseUrl}${params.endpoint}`);

        if (params.urlParams) {
            this.updateUrlWithParams(url, params.urlParams)
        }

        if (this.isAuthenticated()) {
            requestHeaders.set('Authentication', `Bearer ${this.config.authBearerToken}`);
        }

        if (params.method === XanoRequestType.HEAD) {
            requestHeaders.set('Accept', XanoContentType.Text);
        } else if (params.method === XanoRequestType.DELETE) {
            requestHeaders.set('Accept', XanoContentType.Text);
        } else if (this.config.responseType === XanoResponseType.Text) {
            requestHeaders.set('Accept', XanoContentType.Text);
        } else if (this.config.responseType === XanoResponseType.JSON) {
            requestHeaders.set('Accept', XanoContentType.JSON);
        }

        let requestOptions: Partial<RequestInit> = {
            headers: requestHeaders,
            method: params.method
        };

        if (params.bodyParams) {
            requestHeaders.set('Content-Type', XanoContentType.JSON);

            requestOptions.body = JSON.stringify(params.bodyParams);
        }

        let rawResponse: Response;

        return fetch(url.toString(), requestOptions).then(
            (response: Response) => {
                rawResponse = response;

                switch (requestHeaders.get('Accept')) {
                    case XanoContentType.JSON: return response.json();
                    case XanoContentType.Text: return response.text();
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

    private updateUrlWithParams(url: URL, params: Record<any, any>): void {
        let urlParams = new URLSearchParams(url.search);

        Object.keys(params).forEach((index) => {
            urlParams.set(index, params[index]);
        });

        url.search = urlParams.toString();
    }

    public setAuthBearerToken(bearerToken: string | null): XanoClient {
        this.config.authBearerToken = bearerToken;

        return this;
    }

    public setResponseType(responseType: XanoResponseType): XanoClient {
        this.config.responseType = responseType;

        return this;
    }

    public delete(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: XanoRequestType.DELETE,
        });
    }

    public get(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            endpoint: endpoint,
            method: XanoRequestType.GET,
            urlParams: params,
        });
    }

    public head(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            endpoint: endpoint,
            method: XanoRequestType.HEAD,
            urlParams: params,
        });
    }

    public patch(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: XanoRequestType.PATCH,
        });
    }

    public post(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: XanoRequestType.POST,
        });
    }

    public put(endpoint: string, params?: Record<any, any>): Promise<XanoResponse> {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: XanoRequestType.PUT,
        });
    }
}
