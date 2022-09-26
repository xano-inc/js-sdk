import { XanoBaseClient } from './base-client';
import { XanoLocalStorage } from './models/local-storage';
import { XanoClientConfig } from './interfaces/client-config';

export class XanoClient extends XanoBaseClient {
    constructor(config: XanoClientConfig) {
        if (config['storage'] === undefined) {
            config['storage'] = new XanoLocalStorage();
        }

        super(config);
    }

    protected getFormDataInstance(): any {
        return new FormData;
    }
}
