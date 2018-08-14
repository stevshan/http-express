"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
const common_1 = require("./common");
const utils = require("../../utilities/utils");
function toJSON() {
    const jsonObject = Object.create(null);
    const inheritanceStack = [];
    let prototypeObj = this;
    do {
        inheritanceStack.push(prototypeObj);
        prototypeObj = Object.getPrototypeOf(prototypeObj);
    } while (prototypeObj);
    while (prototypeObj = inheritanceStack.pop()) {
        for (const property in prototypeObj) {
            jsonObject[property] = this[property];
        }
    }
    return jsonObject;
}
class HttpClientBase {
    constructor(log, protocol, requestAsyncProcessor, responseAsyncHandler) {
        if (!Object.isObject(log)) {
            throw new Error("log must be supplied.");
        }
        if (String.isString(protocol) && protocol.trim() === "") {
            protocol = undefined;
        }
        this.requestOptions = Object.create(null);
        this.httpRequestOptions = Object.create(null);
        this.log = log;
        this.protocol = utils.getValue(protocol, common_1.HttpProtocols.any);
        // request processor.
        if (utils.isNullOrUndefined(requestAsyncProcessor) || Function.isFunction(requestAsyncProcessor)) {
            this.requestAsyncProcessor = requestAsyncProcessor;
        }
        else {
            throw new Error("requestAsyncProcessor must be a function.");
        }
        // response processor.
        if (utils.isNullOrUndefined(responseAsyncHandler)) {
            this.responseAsyncHandler =
                async (client, log, requestOptions, requestData, response) => response;
        }
        else if (!Function.isFunction(responseAsyncHandler)) {
            throw new Error("responseAsyncHandler must be a function.");
        }
        else {
            this.responseAsyncHandler = responseAsyncHandler;
        }
    }
    get defaultRequestOptions() {
        return Promise.resolve(this.requestOptions);
    }
    async updateDefaultRequestOptionsAsync(options) {
        this.httpRequestOptions = options ? await this.generateHttpRequestOptionsAsync(options) : Object.create(null);
        this.requestOptions = options ? options : Object.create(null);
        if (this.httpRequestOptions) {
            Object.defineProperty(this.httpRequestOptions, "toJSON", {
                writable: true,
                configurable: false,
                enumerable: false,
                value: toJSON
            });
        }
    }
    deleteAsync(url) {
        return this.requestAsync({
            url: url,
            method: common_1.HttpMethods.delete
        }, null);
    }
    getAsync(url) {
        return this.requestAsync({
            url: url,
            method: common_1.HttpMethods.get
        }, null);
    }
    patchAsync(url, data) {
        return this.requestAsync({
            url: url,
            method: common_1.HttpMethods.patch,
        }, data);
    }
    postAsync(url, data) {
        return this.requestAsync({
            url: url,
            method: common_1.HttpMethods.post,
        }, data);
    }
    putAsync(url, data) {
        return this.requestAsync({
            url: url,
            method: common_1.HttpMethods.put,
        }, data);
    }
    async requestAsync(requestOptions, data) {
        if (!Object.isObject(requestOptions)) {
            throw new Error("requestOptions must be supplied.");
        }
        if (!String.isString(requestOptions.url)) {
            throw new Error("requestOptions.url must be supplied.");
        }
        if (!String.isString(requestOptions.method) || requestOptions.method.trim() === "") {
            throw new Error("requestOptions.method must be supplied.");
        }
        if (!utils.isNullOrUndefined(data)
            && (requestOptions.method === common_1.HttpMethods.get || requestOptions.method === common_1.HttpMethods.delete)) {
            throw new Error("For HTTP method, GET and DELETE, data cannot be supplied.");
        }
        const requestId = `HTTP:${uuidv4()}`;
        this.log.writeInfoAsync(`[${requestId}] Generating http request options ...`);
        const httpRequestOptions = await this.generateHttpRequestOptionsAsync(requestOptions);
        this.log.writeInfoAsync(`[${requestId}] Creating request: HTTP ${requestOptions.method} => ${requestOptions.url}`);
        const request = this.makeRequest(httpRequestOptions);
        this.log.writeInfoAsync(`[${requestId}] Processing HTTP request ...`);
        return this.requestAsyncProcessor(this, this.log, requestOptions, data, request)
            .then(() => {
            this.log.writeInfoAsync(`[${requestId}] Sending HTTP request ...`);
            return this.sendRequestAsync(request);
        })
            .then((response) => {
            this.log.writeInfoAsync(`[${requestId}] Received response: HTTP/${response.httpVersion} ${response.statusCode} ${response.statusMessage}`);
            this.log.writeInfoAsync(`[${requestId}] Processing HTTP response ...`);
            return this.responseAsyncHandler(this, this.log, requestOptions, data, response)
                .then(async (result) => {
                this.log.writeInfoAsync(`[${requestId}] Processing HTTP response completed.`);
                if (result !== response) {
                    await response.setDataAsync(result);
                }
                return response;
            }, (reason) => {
                this.log.writeErrorAsync(`[${requestId}] Failed to process HTTP response, error: ${reason}`);
                return reason;
            });
        }, (reason) => {
            this.log.writeInfoAsync(`[${requestId}] Failed sending HTTP request: ${reason}`);
            return reason;
        });
    }
}
exports.default = HttpClientBase;
//# sourceMappingURL=http-client-base.js.map