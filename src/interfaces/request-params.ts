import { XanoRequestType } from "../enums/request-type";

export interface XanoRequestParams {
    endpoint: string,
    method: XanoRequestType,
    urlParams?: Record<any, any>,
    bodyParams?: Record<any, any>
}
