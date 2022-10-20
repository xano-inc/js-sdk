import { AxiosResponse } from 'axios';

export class XanoResponse {
    private body: any;
    private headers: Record<string, string>;
    private objectPrefix: string;
    private status: number;

    constructor(response: AxiosResponse, objectPrefix: string = '') {
        this.body = response.data;
        this.headers = response.headers ?? {};
        this.objectPrefix = objectPrefix;
        this.status = response.status;

        if (typeof this.body === 'string' && this.body.length > 0) {
            const contentType = this.headers['content-type'] ?? '';
            if (contentType.indexOf('application/json') === 0) {
                try {
                    this.body = JSON.parse(this.body);
                } catch (e) { }
            }
        }
    }

    private prefixArray(arr: any[], objectPrefix: string): any[] {
        let prefixedArray: any = [];

        arr.forEach((item) => {
            const prefixedItem = this.prefixObject(item, objectPrefix);

            prefixedArray.push(prefixedItem);
        });

        return prefixedArray;
    }

    private prefixObject(obj: Record<any, any>, objectPrefix: string): Record<any, any> {
        let prefixedObject = {};

        Object.keys(obj).forEach((key) => {
            const prefixedKey = `${objectPrefix}${key}`;
            const type = this.typeOf(obj[key]);

            if (type === 'array') {
                prefixedObject[prefixedKey] = this.prefixArray(obj[key], objectPrefix);
            } else if (type === 'object') {
                prefixedObject[prefixedKey] = this.prefixObject(obj[key], objectPrefix);
            } else {
                prefixedObject[prefixedKey] = obj[key];
            }
        });

        return prefixedObject;
    }

    private typeOf(data: any): string {
        if (data === null) {
            return 'null';
        }

        const type = typeof data;
        if (type === 'object' && Array.isArray(data)) {
            return 'array';
        }

        return type;
    }

    public getBody(objectPrefix: string = ''): any {
        objectPrefix = objectPrefix || this.objectPrefix;

        if (objectPrefix) {
            const type = this.typeOf(this.body);
            if (type === 'array') {
                return this.prefixArray(this.body, objectPrefix);
            } else if (type === 'object') {
                return this.prefixObject(this.body, objectPrefix);
            }
        }

        return this.body;
    }

    public getHeaders(): Record<string, string> {
        return this.headers;
    }

    public getStatusCode(): number {
        return this.status;
    }
}
