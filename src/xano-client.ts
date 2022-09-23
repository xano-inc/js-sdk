import { BaseClient } from './base-client';

export class XanoClient extends BaseClient {
    protected getFormDataInstance(): any {
        return new FormData;
    }
}
