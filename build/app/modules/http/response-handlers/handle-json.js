"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
function isJsonResponse(log, response) {
    const regex_filename_json = /filename=.+\.json/i;
    const contentType = response.headers["content-type"];
    const contentDisposition = response.headers["content-disposition"];
    if (!String.isString(contentType)) {
        return false;
    }
    if (contentType.indexOf(common_1.HttpContentTypes.json) >= 0) {
        return true;
    }
    if (contentType.indexOf(common_1.HttpContentTypes.binary) >= 0
        && regex_filename_json.test(contentDisposition)) {
        log.writeVerboseAsync(`Treat Content-Type (${contentType}) as JSON since Content-Disposition header (${contentDisposition}) indicates JSON extension.`);
        return true;
    }
    return false;
}
async function handleJsonAsync(nextHandler) {
    return async (client, log, requestOptions, requestData, response) => {
        const statusCode = await response.statusCode;
        if (statusCode >= 200 && statusCode < 300 && isJsonResponse(log, response)) {
            await response.setEncodingAsync("utf8");
            let chunk;
            let json = "";
            while (chunk = await response.readAsync()) {
                json += chunk;
            }
            return JSON.parse(json);
        }
        if (Function.isFunction(nextHandler)) {
            return nextHandler(client, log, requestOptions, requestData, response);
        }
        return Promise.resolve(response);
    };
}
exports.default = handleJsonAsync;
//# sourceMappingURL=handle-json.js.map