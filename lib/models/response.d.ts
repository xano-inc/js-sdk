import { AxiosResponse } from "axios";
export declare class XanoResponse {
    private response;
    constructor(response: AxiosResponse);
    getBody(): any;
    getHeaders(): Record<string, string>;
    getStatusCode(): number;
}
//# sourceMappingURL=response.d.ts.map