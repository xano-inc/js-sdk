import { XanoBaseClient } from './base-client';

export class XanoClient extends XanoBaseClient {
    protected getFormDataInstance(): any {
        return new FormData;
    }
}
