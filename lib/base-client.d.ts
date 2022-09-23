import { XanoClientConfig } from './interfaces/client-config';
import { XanoResponse } from './models/response';
export declare abstract class BaseClient {
    private config;
    constructor(config: XanoClientConfig);
    protected abstract getFormDataInstance(): any;
    protected abstract isFile(instance: any): boolean;
    private buildFormData;
    private hasAuthToken;
    private request;
    setAuthToken(authToken: string | null): this;
    delete(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    get(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    head(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    patch(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    post(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
    put(endpoint: string, params?: Record<any, any>): Promise<XanoResponse>;
}
//# sourceMappingURL=base-client.d.ts.map