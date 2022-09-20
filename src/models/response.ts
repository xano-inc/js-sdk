export class XanoResponse {
    private data: any;
    private response: Response;

    constructor(response: Response, data: any) {
        this.data = data;
        this.response = response;
    }

    public getStatusCode(): number {
        return this.response.status;
    }

    public getData(): any {
        return this.data;
    }
}
