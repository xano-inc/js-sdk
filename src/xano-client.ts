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
        return typeof this.config.authBearerToken === 'string' && this.config.authBearerToken.length > 0;
    }

    private request(params: XanoRequestParams): Promise<XanoResponse> {
        let headers: Headers = new Headers();

        if (this.isAuthenticated()) {
            headers.set('Authentication', `Bearer ${this.config.authBearerToken}`);
        }

        let rawResponse: Response;

        return fetch(`${this.config.apiGroupBaseUrl}${params.endpoint}`, {
            method: params.method,
            // headers: headers
        }).then(
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

    public get(endpoint: string, params: Record<any, any>): Promise<any> {
        return this.request({
            method: XanoRequestType.GET,
            endpoint: endpoint,
            urlParams: params
        });
    }
}