import { XanoRequestType } from "../enums/request-type";

export interface XanoRequestParams {
    bodyParams?: Record<any, any>;
    endpoint: string;
    method: XanoRequestType;
    urlParams?: Record<any, any>;
}
