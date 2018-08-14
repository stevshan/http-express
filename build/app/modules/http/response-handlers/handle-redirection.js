"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
async function handleRedirectionAsync(nextHandler) {
    return async (client, log, requestOptions, requestData, response) => {
        const statusCode = await response.statusCode;
        if (statusCode === 301
            || statusCode === 302
            || statusCode === 307
            || statusCode === 308) {
            const location = response.headers["location"];
            const redirectionRequestOptions = JSON.parse(JSON.stringify(requestOptions));
            redirectionRequestOptions.url = location;
            log.writeInfoAsync("HTTP{}: Redirecting to {}", response.statusCode, redirectionRequestOptions.url);
            return client.requestAsync(redirectionRequestOptions, requestData);
        }
        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }
        return Promise.resolve(response);
    };
}
exports.default = handleRedirectionAsync;
//# sourceMappingURL=handle-redirection.js.map