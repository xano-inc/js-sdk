import { RequestType } from "../enums/request-type";

export interface RequestParams {
    endpoint: string,
    method: RequestType,
    urlParams?: Record<any, any>
}