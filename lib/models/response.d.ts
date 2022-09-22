export declare class XanoResponse {
    private body;
    private response;
    constructor(response: Response, body: any);
    getBody(): any;
    getHeaders(): Record<string, string>;
    getStatusCode(): number;
}
