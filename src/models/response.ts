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

    public getBody(objectPrefix: string = ''): any {
        objectPrefix = objectPrefix || this.objectPrefix;

        if (objectPrefix && typeof this.body === 'object' && !Array.isArray(this.body)) {
            let prefixedBody = {};

            Object.keys(this.body).forEach((key) => {
                const prefixedKey = `${objectPrefix}${key}`;

                prefixedBody[prefixedKey] = this.body[key];
            });

            return prefixedBody;
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
