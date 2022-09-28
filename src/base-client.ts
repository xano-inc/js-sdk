import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { XanoClientConfig } from './interfaces/client-config';
import { XanoContentType } from './enums/content-type';
import { XanoFile } from './models/file';
import { XanoFormData } from './interfaces/form-data';
import { XanoRequestError } from './errors/request';
import { XanoRequestParams } from './interfaces/request-params';
import { XanoRequestType } from './enums/request-type';
import { XanoResponse } from './models/response';
import { XanoObjectStorage } from './models/object-storage';
import { XanoStorageKeys } from './enums/storage-keys';

export abstract class XanoBaseClient {
    private config: XanoClientConfig = {
        apiGroupBaseUrl: null,
        authToken: null,
        responseObjectPrefix: '',
        storage: new XanoObjectStorage()
    };

    constructor(config: Partial<XanoClientConfig>) {
        this.config = {
            ...this.config,
            ...config
        };

        if (this.config.authToken !== undefined) {
            if (typeof this.config.authToken === 'string') {
                this.config.storage.setItem(XanoStorageKeys.AuthToken, this.config.authToken);
            } else {
                this.config.storage.removeItem(XanoStorageKeys.AuthToken);
            }
        }
    }

    protected abstract getFormDataInstance(): any;

    private buildFormData(bodyData: Record<any, any>): XanoFormData {
        const formData = this.getFormDataInstance();
        let hasFile = false;
        let rawFormData: Record<any, any> = {};

        Object.entries(bodyData).forEach((entry: any) => {
            const isFileType = this.isFileType(entry[1]);

            if (isFileType) {
                hasFile = true;
            }

            if (typeof entry[1] === 'object' && !isFileType) {
                entry[1] = JSON.stringify(entry[1]);
            }

            rawFormData[entry[0]] = entry[1];

            if (entry[1] instanceof XanoFile) {
                formData.append(entry[0], entry[1].getBuffer(), entry[1].getName());
            } else {
                formData.append(entry[0], entry[1]);
            }
        });

        return <XanoFormData>{
            formData,
            hasFile,
            rawFormData
        };
    }

    private isFileType(instance: any): boolean {
        if (typeof File !== 'undefined') {
            if (instance instanceof File) {
                return true;
            }
        }

        return instance instanceof XanoFile;
    }

    private request(params: XanoRequestParams): Promise<any> {
        const axiosConfig = <AxiosRequestConfig>{
            baseURL: this.config.apiGroupBaseUrl,
            headers: {},
            method: params.method,
            params: params.urlParams,
            url: params.endpoint,
            validateStatus: () => true,
        };

        const requestHeaders = {};

        if (this.hasAuthToken()) {
            const authToken = this.config.storage.getItem(XanoStorageKeys.AuthToken);

            requestHeaders['Authorization'] = `Bearer ${authToken}`;
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

        return axios.request(axiosConfig).then(
            (response: AxiosResponse) => {
                const resp = new XanoResponse(response, this.config.responseObjectPrefix ?? '');

                if (response.status < 200 || response.status >= 300) {
                    throw new XanoRequestError('There was an error with your request', resp);
                }

                return resp;
            }
        );
    }

    public hasAuthToken(): boolean {
        const authToken = this.config.storage.getItem(XanoStorageKeys.AuthToken);

        return typeof authToken === 'string' && authToken.length > 0;
    }

    public setAuthToken(authToken: string | null): this {
        if (authToken === null) {
            this.config.storage.removeItem(XanoStorageKeys.AuthToken);
        } else {
            this.config.storage.setItem(XanoStorageKeys.AuthToken, authToken);
        }

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
