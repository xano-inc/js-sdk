import { XanoResponse } from "../models/response";

export class XanoRequestError extends Error {
    public getHttpResponse: () => XanoResponse;

    constructor(message: string, httpResponse: XanoResponse) {
        super(message);

        this.getHttpResponse = (): XanoResponse => {
            return httpResponse;
        };
    }
}