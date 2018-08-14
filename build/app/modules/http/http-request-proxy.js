"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class HttpRequestProxy {
    get httpRequest() {
        return this._httpRequest;
    }
    constructor(underlyingHttpRequest) {
        if (!underlyingHttpRequest) {
            throw new Error("underlyingHttpRequest must be provided.");
        }
        this._httpRequest = underlyingHttpRequest;
    }
    getHeaderAsync(name) {
        return Promise.resolve(this.httpRequest.getHeader(name));
    }
    setHeaderAsync(name, value) {
        this.httpRequest.setHeader(name, value);
        return Promise.resolve();
    }
    removeHeaderAsync(name) {
        this.httpRequest.removeHeader(name);
        return Promise.resolve();
    }
    writeAsync(data) {
        if (String.isString(data) || data instanceof Buffer) {
            return new Promise((resolve) => this.httpRequest.write(data, undefined, () => resolve()));
        }
        else {
            throw new Error("data must be string or Buffer.");
        }
    }
    abortAsync() {
        this.httpRequest.abort();
        return Promise.resolve();
    }
    endAsync() {
        return new Promise((resolve) => this.httpRequest.end(undefined, undefined, () => resolve()));
    }
}
exports.HttpRequestProxy = HttpRequestProxy;
//# sourceMappingURL=http-request-proxy.js.map