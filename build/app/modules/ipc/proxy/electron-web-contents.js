"use strict";
//-----------------------------------------------------------------------------
// Copyright (c) 2018 Steven Shan. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const electron = require("electron");
const uuidv5 = require("uuid/v5");
const utils = require("../../../utilities/utils");
const channel_proxy_base_1 = require("./channel-proxy-base");
class ElectronWebContentsChannelProxy extends channel_proxy_base_1.default {
    constructor(channel, channelName) {
        super(channel);
        this.onChannelData = (event, data) => {
            this.triggerDataHandler(event.sender, JSON.parse(data));
        };
        this.channelListener = electron.ipcMain || electron.ipcRenderer;
        this.channelName = channelName || uuidv5(channel.id.toString(), common_1.UuidNamespace);
        this.channelListener.on(this.channelName, this.onChannelData);
    }
    static isValidChannel(channel) {
        return !utils.isNullOrUndefined(channel)
            && Function.isFunction(channel.executeJavaScript)
            && Function.isFunction(channel.setAudioMuted)
            && Function.isFunction(channel.setZoomFactor)
            && Function.isFunction(channel.findInPage)
            && Function.isFunction(channel.send);
    }
    disposeAsync() {
        if (!this.disposed) {
            this.channelListener.removeListener(this.channelName, this.onChannelData);
            this.channelListener = undefined;
        }
        return super.disposeAsync();
    }
    sendMessage(msg) {
        if (this.disposed) {
            throw new Error("Channel proxy already disposed.");
        }
        this.channel.send(this.channelName, JSON.stringify(msg));
        return true;
    }
}
exports.default = ElectronWebContentsChannelProxy;
//# sourceMappingURL=electron-web-contents.js.map