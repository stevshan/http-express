//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

import {
    RequestAsyncProcessor,
    IRequestOptions,
    IHttpClient,
    IHttpRequest
} from "http-express.http";

import { ILog } from "http-express.logging";

import { HttpContentTypes } from "../common";
import * as utils from "../../../utilities/utils";

export default async function handleJsonAsync(nextHandler: RequestAsyncProcessor): Promise<RequestAsyncProcessor> {
    return async (client: IHttpClient, log: ILog, requestOptions: IRequestOptions, requestData: any, request: IHttpRequest): Promise<void> => {
        const contentType = await request.getHeaderAsync("Content-Type");

        if (String.isString(contentType)
            && contentType.indexOf(HttpContentTypes.json) >= 0) {
            const jsonBody = JSON.stringify(requestData);

            await request.setHeaderAsync("Content-Length", Buffer.byteLength(jsonBody));
            await request.writeAsync(jsonBody);
        } else if (!utils.isNullOrUndefined(requestData)) {
            throw new Error("Header Content-Type is missing in the request but the data is supplied.");
        }

        if (Function.isFunction(nextHandler)) {
            await nextHandler(client, log, requestOptions, requestData, request);
        }
    };
}
