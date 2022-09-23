import { AxiosResponse } from 'axios';

export class XanoResponse {
    private body: any;
    private response: AxiosResponse;

    constructor(response: AxiosResponse) {
        this.response = response;
        this.body = response.data;

        if (typeof this.body === 'string' && this.body.length > 0) {
            const contentType = response.headers['content-type'] ?? '';
            if (contentType.indexOf('application/json') === 0) {
                try {
                    this.body = JSON.parse(this.response.data);
                } catch (e) { }
            }
        }
    }

    public getBody(): any {
        return this.body;
    }

    public getHeaders(): Record<string, string> {
        return this.response.headers;
    }

    public getStatusCode(): number {
        return this.response.status;
    }
}
