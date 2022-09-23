import { AxiosResponse } from "axios";

export class XanoResponse {
    private response: AxiosResponse;

    constructor(response: AxiosResponse) {
        this.response = response;
    }

    public getBody(): any {
        return this.response.data;
    }

    public getHeaders(): Record<string, string> {
        return this.response.headers;
    }

    public getStatusCode(): number {
        return this.response.status;
    }
}
