"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const utils = require("../../../utilities/utils");
async function handleJsonAsync(nextHandler) {
    return async (client, log, requestOptions, requestData, request) => {
        const contentType = await request.getHeaderAsync("Content-Type");
        if (String.isString(contentType)
            && contentType.indexOf(common_1.HttpContentTypes.json) >= 0) {
            const jsonBody = JSON.stringify(requestData);
            await request.setHeaderAsync("Content-Length", Buffer.byteLength(jsonBody));
            await request.writeAsync(jsonBody);
        }
        else if (!utils.isNullOrUndefined(requestData)) {
            throw new Error("Header Content-Type is missing in the request but the data is supplied.");
        }
        if (Function.isFunction(nextHandler)) {
            await nextHandler(client, log, requestOptions, requestData, request);
        }
    };
}
exports.default = handleJsonAsync;
//# sourceMappingURL=handle-json.js.map