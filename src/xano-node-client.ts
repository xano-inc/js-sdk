import { BaseClient } from './base-client';
import FormData = require('form-data');

export class XanoNodeClient extends BaseClient {
    protected getFormDataInstance(): any {
        return new FormData;
    }

    protected isFile(instance: any): boolean {
        return (instance instanceof Buffer);
    }
}
