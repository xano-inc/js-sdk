export class XanoResponse {
    private body: any;
    private response: Response;

    constructor(response: Response, body: any) {
        this.body = body;
        this.response = response;
    }

    public getBody(): any {
        return this.body;
    }

    public getHeaders(): Record<string, string> {
        let headers: Record<string, string> = {};

        this.response.headers.forEach((value: string, key: string) => {
            headers[key] = value;
        });

        return headers;
    }

    public getStatusCode(): number {
        return this.response.status;
    }
}
