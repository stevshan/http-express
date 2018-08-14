"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../../../utilities/utils");
const channel_proxy_base_1 = require("./channel-proxy-base");
class ProcessChannelProxy extends channel_proxy_base_1.default {
    constructor(channel) {
        super(channel);
        this.onMessage = (message) => {
            this.triggerDataHandler(this.channel, JSON.parse(message));
        };
        this.channel.on("message", this.onMessage);
    }
    // Process and ChildProcess share the same functions but ChildProcess has more detailed type information.
    //
    // Process:
    // https://nodejs.org/docs/latest-v8.x/api/process.html#process_process_send_message_sendhandle_options_callback
    // https://nodejs.org/docs/latest-v8.x/api/process.html#process_event_message
    //
    // ChildProcess:
    // https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_event_message
    // https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
    static isValidChannel(channel) {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.kill)
            && Number.isNumber(channel.pid)
            && Function.isFunction(channel.send)
            && Function.isFunction(channel.on)
            && Function.isFunction(channel.removeListener);
    }
    disposeAsync() {
        if (!this.disposed) {
            this.channel.removeListener("message", this.onMessage);
        }
        return super.disposeAsync();
    }
    sendMessage(msg) {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }
        return this.channel.send(JSON.stringify(msg));
    }
}
exports.default = ProcessChannelProxy;
//# sourceMappingURL=process.js.map