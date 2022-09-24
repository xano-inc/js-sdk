import { AxiosResponse } from 'axios';

export class XanoResponse {
    private body: any;
    private headers: Record<string, string>;
    private status: number;

    constructor(response: AxiosResponse) {
        this.body = response.data;
        this.headers = response.headers ?? {};
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

    public getBody(): any {
        return this.body;
    }

    public getHeaders(): Record<string, string> {
        return this.headers;
    }

    public getStatusCode(): number {
        return this.status;
    }
}
