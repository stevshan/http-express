"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class HttpResponseProxy {
    get data() {
        return Promise.resolve(this._data);
    }
    get httpResponse() {
        return this._httpResponse;
    }
    get httpVersion() {
        return Promise.resolve(this.httpResponse.httpVersion);
    }
    get statusCode() {
        return Promise.resolve(this.httpResponse.statusCode);
    }
    get statusMessage() {
        return Promise.resolve(this.httpResponse.statusMessage);
    }
    get headers() {
        return Promise.resolve(this.httpResponse.headers);
    }
    constructor(underlyinghttpResponse) {
        if (!underlyinghttpResponse) {
            throw new Error("underlyinghttpResponse must be provided.");
        }
        this._httpResponse = underlyinghttpResponse;
    }
    async setEncodingAsync(encoding) {
        this.httpResponse.setEncoding(encoding);
    }
    async readAsync() {
        return this.httpResponse.read();
    }
    async setDataAsync(data) {
        this._data = data;
    }
}
exports.HttpResponseProxy = HttpResponseProxy;
//# sourceMappingURL=http-response-proxy.js.map