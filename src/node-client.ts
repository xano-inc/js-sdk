import { XanoBaseClient } from './base-client';

export class XanoNodeClient extends XanoBaseClient {
    protected getFormDataInstance(): any {
        return new (require('form-data'))();
    }
}
