"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require("uuid/v4");
const utils = require("../../utilities/utils");
const process_1 = require("./proxy/process");
const electron_web_contents_1 = require("./proxy/electron-web-contents");
const electron_ipc_renderer_1 = require("./proxy/electron-ipc-renderer");
const socket_1 = require("./proxy/socket");
function generateChannelProxy(channel) {
    if (utils.isNullOrUndefined(channel)) {
        throw new Error("channel must be supplied.");
    }
    else if (process_1.default.isValidChannel(channel)) {
        return new process_1.default(channel);
    }
    else if (electron_web_contents_1.default.isValidChannel(channel)) {
        return new electron_web_contents_1.default(channel);
    }
    else if (electron_ipc_renderer_1.default.isValidChannel(channel)) {
        return new electron_ipc_renderer_1.default(channel);
    }
    else if (socket_1.default.isValidChannel(channel)) {
        return new socket_1.default(channel);
    }
    else {
        throw new Error("Unknown channel type. Only supports NodeJS.Process, NodeJS.ChildProcess, NodeJS.Socket, Electron.IpcRenderer, Electron.WebContents.");
    }
}
class Communicator {
    constructor(channelProxy, options) {
        this.onMessageAsync = async (channel, msg) => {
            const promise = this.ongoingPromiseDict[msg.id];
            if (promise) {
                delete this.ongoingPromiseDict[msg.id];
                msg.succeeded ? promise.resolve(msg.body) : promise.reject(msg.body);
            }
            else if (utils.isNullOrUndefined(msg.succeeded)) {
                const route = this.routes.find((route) => route.pattern.match(msg.path));
                if (route !== undefined) {
                    let response;
                    let succeeded;
                    try {
                        response = await route.asyncHandler(this, msg.path, msg.body);
                        succeeded = true;
                    }
                    catch (exception) {
                        response = exception;
                        succeeded = false;
                    }
                    if (!this.channelProxy.sendMessage({
                        id: msg.id,
                        path: msg.path,
                        succeeded: succeeded,
                        body: response
                    })) {
                        // Log if failed.
                    }
                }
            }
        };
        this.routes = [];
        this.ongoingPromiseDict = Object.create(null);
        this.id = uuidv4();
        this.timeout = 10 * 1000; // 10 seconds.
        if (options) {
            if (String.isString(options.id)
                && !String.isEmptyOrWhitespace(options.id)) {
                this.id = options.id;
            }
            if (Number.isInteger(options.timeout)) {
                this.timeout = options.timeout;
            }
        }
        this.channelProxy = channelProxy;
        this.channelProxy.setDataHandler(this.onMessageAsync);
    }
    static fromChannel(channel, options) {
        return new Communicator(generateChannelProxy(channel), options);
    }
    map(pattern, asyncHandler) {
        this.validateDisposal();
        if (!pattern) {
            throw new Error("pattern must be provided.");
        }
        if (!Function.isFunction(asyncHandler)) {
            throw new Error("asyncHandler must be a function.");
        }
        const route = {
            pattern: pattern,
            asyncHandler: asyncHandler
        };
        this.routes.push(route);
    }
    unmap(pattern) {
        this.validateDisposal();
        if (utils.isNullOrUndefined(pattern)) {
            throw new Error("pattern must be supplied.");
        }
        const routeIndex = this.routes.findIndex((route) => route.pattern.equals(pattern));
        if (routeIndex < 0) {
            return undefined;
        }
        const asyncHandler = this.routes[routeIndex].asyncHandler;
        this.routes.splice(routeIndex, 1);
        return asyncHandler;
    }
    sendAsync(path, content) {
        this.validateDisposal();
        if (String.isEmptyOrWhitespace(path)) {
            throw new Error("path must be a string and not empty/whitespaces.");
        }
        return new Promise((resolve, reject) => {
            const msg = {
                id: uuidv4(),
                path: path,
                body: content
            };
            if (!this.channelProxy.sendMessage(msg)) {
                reject(new Error("Failed to send request. The remote channel may be closed."));
                return;
            }
            const timer = setTimeout((reject) => {
                delete this.ongoingPromiseDict[msg.id];
                reject(new Error(utils.format("Response for the ipc message timed out: {}", msg)));
            }, this.timeout, reject);
            this.ongoingPromiseDict[msg.id] = {
                resolve: (result) => {
                    clearTimeout(timer);
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timer);
                    reject(error);
                }
            };
        });
    }
    get disposed() {
        return this.channelProxy === undefined;
    }
    async disposeAsync() {
        if (this.disposed) {
            return;
        }
        await this.channelProxy.disposeAsync();
        Object.values(this.ongoingPromiseDict).forEach((resolver) => resolver.reject(new Error(`Communicator (${this.id}) is disposed.`)));
        this.channelProxy.setDataHandler(undefined);
        this.channelProxy = undefined;
        this.routes = undefined;
        this.ongoingPromiseDict = undefined;
    }
    validateDisposal() {
        if (this.disposed) {
            throw new Error(`Communicator (${this.id}) already disposed.`);
        }
    }
}
exports.Communicator = Communicator;
//# sourceMappingURL=communicator.js.map