import { AxiosRequestConfig } from "axios";
import { IPicGo, IRequestConfig, IOldReqOptions, IResponse, IRequest } from "../types";
export declare class Request implements IRequest {
    private readonly ctx;
    private proxy;
    options: AxiosRequestConfig<any>;
    constructor(ctx: IPicGo);
    private init;
    private handleProxy;
    request<T, U extends IRequestConfig<U> extends IOldReqOptions ? IOldReqOptions : IRequestConfig<U> extends AxiosRequestConfig ? AxiosRequestConfig : never>(options: U): Promise<IResponse<T, U>>;
}
export default Request;
