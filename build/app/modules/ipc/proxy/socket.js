"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../../../utilities/utils");
const channel_proxy_base_1 = require("./channel-proxy-base");
class SocketChannelProxy extends channel_proxy_base_1.default {
    constructor(channel) {
        super(channel);
        this.onChannelData = (data) => {
            if (String.isString(data)) {
                try {
                    this.triggerDataHandler(this.channel, JSON.parse(data));
                }
                catch (_a) { }
            }
        };
        this.channel.on("data", this.onChannelData);
    }
    static isValidChannel(channel) {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.write)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }
    disposeAsync() {
        if (!this.disposed) {
            this.channel.removeListener("data", this.onChannelData);
        }
        return super.disposeAsync();
    }
    sendMessage(msg) {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }
        return this.channel.write(JSON.stringify(msg));
    }
}
exports.default = SocketChannelProxy;
//# sourceMappingURL=socket.js.map