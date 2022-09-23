import { BaseClient } from './base-client';

export class XanoNodeClient extends BaseClient {
    protected getFormDataInstance(): any {
        return new (require('form-data'))();
    }
}
