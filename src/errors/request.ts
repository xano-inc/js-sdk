import { XanoResponse } from '../models/response';

export class XanoRequestError extends Error {
    public getResponse: () => XanoResponse;

    constructor(message: string, response: XanoResponse) {
        super(message);

        this.getResponse = (): XanoResponse => {
            return response;
        };
    }
}
