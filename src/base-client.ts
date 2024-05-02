import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { XanoClientConfig } from "./interfaces/client-config";
import { XanoContentType } from "./enums/content-type";
import { XanoFile } from "./models/file";
import { XanoFormData } from "./interfaces/form-data";
import { XanoObjectStorage } from "./models/object-storage";
import { XanoRealtimeChannel } from "./models/realtime-channel";
import { XanoRequestError } from "./errors/request";
import { XanoRequestParams } from "./interfaces/request-params";
import { XanoRequestType } from "./enums/request-type";
import { XanoResponse } from "./models/response";
import { XanoStorageKeys } from "./enums/storage-keys";
import { IRealtimeChannelOptions } from "./interfaces/realtime-channel-options";

export abstract class XanoBaseClient {
  private config: XanoClientConfig = {
    apiGroupBaseUrl: null,
    authToken: null,
    customAxiosRequestConfig: {},
    dataSource: null,
    responseObjectPrefix: "",
    storage: new XanoObjectStorage(),
  };

  constructor(config: Partial<XanoClientConfig>) {
    this.config = {
      ...this.config,
      ...config,
    };

    if (config?.authToken !== undefined) {
      if (
        typeof this.config.authToken === "string" &&
        this.config.authToken.length > 0
      ) {
        this.config.storage.setItem(
          XanoStorageKeys.AuthToken,
          this.config.authToken
        );
      } else {
        this.config.storage.removeItem(XanoStorageKeys.AuthToken);
      }
    }
  }

  protected abstract getFormDataInstance(): any;
  protected abstract appendFormData(
    formData: any,
    key: string,
    value: any
  ): void;

  private buildFormData(bodyData: Record<any, any>): XanoFormData {
    const formData = this.getFormDataInstance();
    let hasFile = false;
    let rawFormData: Record<any, any> = {};

    Object.entries(bodyData).forEach((entry: any) => {
      const isFileType = this.isFileType(entry[1]);
      if (isFileType) {
        hasFile = true;
      }

      rawFormData[entry[0]] = entry[1];

      if (entry[1] instanceof XanoFile) {
        formData.append(entry[0], entry[1].getBuffer(), entry[1].getName());
      } else {
        this.appendFormData(formData, entry[0], entry[1]);
      }
    });

    return <XanoFormData>{
      formData,
      hasFile,
      rawFormData,
    };
  }

  private isFileType(instance: any): boolean {
    if (typeof File !== "undefined") {
      if (instance instanceof File) {
        return true;
      }
    }

    return instance instanceof XanoFile;
  }

  private request(params: XanoRequestParams): Promise<any> {
    const axiosConfig = <AxiosRequestConfig>{
      ...this.config.customAxiosRequestConfig,
      baseURL: this.config.apiGroupBaseUrl,
      method: params.method,
      params: params.urlParams,
      url: params.endpoint,
      validateStatus: () => true,
    };

    if (!axiosConfig.headers) {
      axiosConfig.headers = {};
    }

    if (params.headerParams) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        ...params.headerParams,
      };
    }

    if (this.hasAuthToken()) {
      const authToken = this.config.storage.getItem(XanoStorageKeys.AuthToken);

      axiosConfig.headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (this.hasDataSource()) {
      axiosConfig.headers["X-Data-Source"] = <string>this.config.dataSource;
    }

    if (params.bodyParams) {
      const ret = this.buildFormData(params.bodyParams);

      if (ret.hasFile) {
        axiosConfig.headers["Content-Type"] = XanoContentType.Multipart;
        axiosConfig.data = ret.formData;
      } else {
        axiosConfig.headers["Content-Type"] = XanoContentType.JSON;
        axiosConfig.data = JSON.stringify(ret.rawFormData);
      }
    }

    return axios.request(axiosConfig).then((response: AxiosResponse) => {
      const resp = new XanoResponse(
        response,
        this.config.responseObjectPrefix ?? ""
      );

      if (response.status < 200 || response.status >= 300) {
        throw new XanoRequestError(
          "There was an error with your request",
          resp
        );
      }

      return resp;
    });
  }

  hasAuthToken(): boolean {
    const authToken = this.config.storage.getItem(XanoStorageKeys.AuthToken);

    return typeof authToken === "string" && authToken.length > 0;
  }

  setAuthToken(authToken: string | null): this {
    if (authToken === null) {
      this.config.storage.removeItem(XanoStorageKeys.AuthToken);
    } else {
      this.config.storage.setItem(XanoStorageKeys.AuthToken, authToken);
    }

    this.config.authToken = authToken;

    return this;
  }

  hasDataSource(): boolean {
    return (
      typeof this.config.dataSource === "string" &&
      this.config.dataSource.length > 0
    );
  }

  setDataSource(dataSource: string | null): this {
    this.config.dataSource = dataSource;

    return this;
  }

  delete(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      bodyParams: params,
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.DELETE,
    });
  }

  get(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.GET,
      urlParams: params,
    });
  }

  head(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.HEAD,
      urlParams: params,
    });
  }

  patch(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      bodyParams: params,
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.PATCH,
    });
  }

  post(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      bodyParams: params,
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.POST,
    });
  }

  put(
    endpoint: string,
    params?: Record<any, any>,
    headers?: Record<any, any>
  ): Promise<XanoResponse> {
    return this.request({
      bodyParams: params,
      endpoint: endpoint,
      headerParams: headers,
      method: XanoRequestType.PUT,
    });
  }

  channel(
    channel: string,
    options: Partial<IRealtimeChannelOptions> = {}
  ): XanoRealtimeChannel {
    if (!this.config.apiGroupBaseUrl) {
      throw Error("XanoClient: apiGroupBaseUrl is required for realtime");
    }

    return new XanoRealtimeChannel(channel, options, this.config);
  }
}
