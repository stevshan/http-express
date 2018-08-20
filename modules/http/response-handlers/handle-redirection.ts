//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    ResponseAsyncHandler,
    IRequestOptions,
    IHttpClient,
    IHttpResponse
} from "http-express.http";

import { ILog } from "http-express.logging";

import * as url from "url";

export default async function handleRedirectionAsync(nextHandler: ResponseAsyncHandler): Promise<ResponseAsyncHandler> {
    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, response: IHttpResponse): Promise<any> => {
        const statusCode = await response.statusCode;

        if (statusCode === 301
            || statusCode === 302
            || statusCode === 307
            || statusCode === 308) {
            const headers = await response.headers;
            const location = <string>headers["location"];
            const redirectionRequestOptions: IRequestOptions = JSON.parse(JSON.stringify(requestOptions));

            redirectionRequestOptions.url = url.resolve(requestOptions.url, location);
            log.writeInfoAsync("HTTP{}: Redirecting to {}", response.statusCode, redirectionRequestOptions.url);

            return client.requestAsync(redirectionRequestOptions, requestData);
        }

        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }

        return Promise.resolve(response);
    };
}
