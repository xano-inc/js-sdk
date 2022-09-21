import { XanoClientConfig } from "./interfaces/client-config";
import { XanoContentType } from "./enums/content-type";
import { XanoFormData } from "./interfaces/form-data";
import { XanoRequestError } from "./errors/request";
import { XanoRequestParams } from "./interfaces/request-params";
import { XanoRequestType } from "./enums/request-type";
import { XanoResponse } from "./models/response";
import { XanoResponseType } from "./enums/response-type";

export class XanoClient {
    private config: XanoClientConfig = {
        apiGroupBaseUrl: null,
        authToken: null,
        responseType: XanoResponseType.Default
    };

    constructor(config: XanoClientConfig) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    private buildFormData(bodyData: Record<any, any>): XanoFormData {
        let formData: FormData = new FormData();
        let hasFile = false;
        let rawFormData: Record<any, any> = {};

        Object.entries(bodyData).forEach((entry: any) => {
            const isFile = (entry[1] instanceof File);

            if (isFile) {
                hasFile = true;
            }

            if (typeof entry[1] === 'object' && !isFile) {
                entry[1] = JSON.stringify(entry[1]);
            }

            rawFormData[entry[0]] = entry[1];
            formData.append(entry[0], entry[1]);
        });

        return <XanoFormData>{
            formData,
            hasFile,
            rawFormData
        };
    }

    private hasAuthToken(): boolean {
        return typeof this.config?.authToken === 'string' && this.config.authToken.length > 0;
    }

    private request(params: XanoRequestParams): Promise<XanoResponse> {
        const requestHeaders: HeadersInit = new Headers();
        const url = new URL(`${this.config.apiGroupBaseUrl}${params.endpoint}`);

        if (params.urlParams) {
            this.updateUrlWithParams(url, params.urlParams)
        }

        if (this.hasAuthToken()) {
            requestHeaders.set('Authorization', `Bearer ${this.config.authToken}`);
        }

        if (params.method === XanoRequestType.HEAD) {
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
            const ret = this.buildFormData(params.bodyParams);

            if (ret.hasFile) {
                requestHeaders.delete('Content-Type');
                requestOptions.body = ret.formData;
            } else {
                requestHeaders.set('Content-Type', XanoContentType.JSON);
                requestOptions.body = JSON.stringify(ret.rawFormData);
            }
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

    public setAuthToken(authToken: string | null): XanoClient {
        this.config.authToken = authToken;

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
