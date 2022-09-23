import { XanoClientConfig } from './interfaces/client-config';
import { XanoContentType } from './enums/content-type';
import { XanoFormData } from './interfaces/form-data';
import { XanoRequestError } from './errors/request';
import { XanoRequestParams } from './interfaces/request-params';
import { XanoRequestType } from './enums/request-type';
import { XanoResponse } from './models/response';
import { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';

export abstract class BaseClient {
    private config: XanoClientConfig = {
        apiGroupBaseUrl: null,
        authToken: null
    };

    constructor(config: XanoClientConfig) {
        this.config = {
            ...this.config,
            ...config
        };
    }

    protected abstract getFormDataInstance(): any;
    protected abstract isFile(instance: any): boolean;

    private buildFormData(bodyData: Record<any, any>): XanoFormData {
        const formData = this.getFormDataInstance();
        let hasFile = false;
        let rawFormData: Record<any, any> = {};

        Object.entries(bodyData).forEach((entry: any) => {
            const isFile = this.isFile(entry[1]);

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

    private request(params: XanoRequestParams): Promise<any> {
        const axiosConfig = <AxiosRequestConfig>{
            baseURL: this.config.apiGroupBaseUrl,
            headers: {},
            method: params.method,
            url: params.endpoint,
        };

        const requestHeaders = {};

        if (params.urlParams) {
            axiosConfig.params = params.urlParams;
        }

        if (this.hasAuthToken()) {
            requestHeaders['Authorization'] = `Bearer ${this.config.authToken}`;
        }

        if (params.bodyParams) {
            const ret = this.buildFormData(params.bodyParams);

            if (ret.hasFile) {
                requestHeaders['Content-Type'] = XanoContentType.Multipart;
                axiosConfig.data = ret.formData;
            } else {
                requestHeaders['Content-Type'] = XanoContentType.JSON
                axiosConfig.data = JSON.stringify(ret.rawFormData);
            }
        }

        axiosConfig.headers = requestHeaders;

        return (new Axios({})).request(axiosConfig).then(
            (response: AxiosResponse) => {
                const resp = new XanoResponse(response);

                if (response.status < 200 || response.status > 299) {
                    throw new XanoRequestError('There was an error with your request', resp);
                }

                return resp;
            }
        );
    }

    public setAuthToken(authToken: string | null): this {
        this.config.authToken = authToken;

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
