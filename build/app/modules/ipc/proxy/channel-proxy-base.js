"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
class ChannelProxyBase {
    constructor(channel) {
        this._channel = channel;
    }
    get channel() {
        return this._channel;
    }
    get disposed() {
        return this._channel === undefined;
    }
    disposeAsync() {
        this.dataHandler = undefined;
        this._channel = undefined;
        return Promise.resolve();
    }
    setDataHandler(handler) {
        if (this.disposed
            && handler !== undefined
            && handler !== null) {
            throw new Error("Channel proxy already disposed.");
        }
        this.dataHandler = handler;
    }
    triggerDataHandler(channel, data) {
        if (Function.isFunction(this.dataHandler)) {
            this.dataHandler(channel, data);
        }
    }
}
exports.default = ChannelProxyBase;
//# sourceMappingURL=channel-proxy-base.js.map