import { XanoResponse } from "../models/response";
export declare class XanoRequestError extends Error {
    getHttpResponse: () => XanoResponse;
    constructor(message: string, httpResponse: XanoResponse);
}
//# sourceMappingURL=request.d.ts.map